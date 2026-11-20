import type { TelemetryData, MissionPhase, CustomWaypoint } from '../types/telemetry';
import { advanceFlight, initFlightState, initFlightStateFromWaypoints, type FlightState } from './flightPath';
import { addNoise, smoothNoise, clamp } from './noiseGenerator';
import { GEOFENCE } from '../utils/constants';
import { haversineDistance } from '../utils/geoUtils';

export type TelemetryCallback = (data: TelemetryData) => void;

export class TelemetryEngine {
  private flightState: FlightState;
  private battery = 95;
  private tickCount = 0;
  private startTime = Date.now();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callback: TelemetryCallback;
  private customWaypoints: CustomWaypoint[] = [];
  private missionActive = false;

  constructor(callback: TelemetryCallback) {
    this.callback = callback;
    this.flightState = initFlightState();
  }

  start() {
    this.startTime = Date.now();
    this.intervalId = setInterval(() => this.tick(), 500);
    this.tick();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setCustomWaypoints(waypoints: CustomWaypoint[]) {
    this.customWaypoints = waypoints;
    if (waypoints.length > 0) {
      this.flightState = initFlightStateFromWaypoints(waypoints);
      this.missionActive = true;
    }
  }

  clearCustomWaypoints() {
    this.customWaypoints = [];
    this.missionActive = false;
    this.flightState = initFlightState();
  }

  private tick() {
    this.tickCount++;
    
    if (this.missionActive && this.customWaypoints.length > 0) {
      this.flightState = advanceFlight(this.flightState, this.customWaypoints);
    }

    const elapsed = (Date.now() - this.startTime) / 1000;
    const { lat, lng, altitude, heading, currentWaypointIndex, completed, navigationMode } = this.flightState;

    if (this.missionActive && !completed && this.tickCount % 4 === 0) {
      this.battery = Math.max(0, this.battery - 0.1);
    }

    const isFlying = this.missionActive && !completed && navigationMode !== 'HOLD';
    const pitch = isFlying ? clamp(addNoise(2, 2), -30, 30) : 0;
    const roll = isFlying ? clamp(addNoise(0, 2), -45, 45) : 0;
    const groundSpeed = isFlying ? clamp(addNoise(12, 3), 0, 30) : 0;
    const verticalSpeed = isFlying ? clamp(addNoise(0, 1), -5, 5) : 0;

    const temperature = clamp(25 - altitude * 0.04 + addNoise(0, 0.5), -10, 50);
    const pressure = clamp(1013 - altitude * 0.12 + addNoise(0, 1), 900, 1100);
    const windSpeed = clamp(smoothNoise(elapsed, 0.1, 6) + 5, 0, 25);
    const satellites = clamp(Math.round(addNoise(12, 2)), 4, 18);
    const hdop = clamp(addNoise(1.0, 0.3), 0.3, 5.0);
    const distToCenter = haversineDistance(lat, lng, GEOFENCE.center.lat, GEOFENCE.center.lng);
    const rssi = clamp(-40 - distToCenter * 0.05 + addNoise(0, 3), -100, -20);

    const totalWps = this.customWaypoints.length;
    const phase = this.getPhase(currentWaypointIndex, completed, navigationMode);
    const progress = completed ? 100 : totalWps > 1 
      ? Math.round((currentWaypointIndex / (totalWps - 1)) * 100) 
      : 0;

    const data: TelemetryData = {
      timestamp: Date.now(),
      position: { latitude: lat, longitude: lng, altitude: clamp(altitude, 0, 200) },
      attitude: { pitch, roll, heading },
      velocity: { groundSpeed, verticalSpeed },
      battery: {
        percentage: this.battery,
        voltage: 11.1 + (this.battery / 100) * 5.4,
        estimatedFlightTime: (this.battery / 0.1) * 2,
      },
      sensors: { temperature, pressure, windSpeed, satellites, hdop, rssi },
      mission: {
        currentWaypoint: currentWaypointIndex,
        totalWaypoints: totalWps,
        phase,
        progress,
      },
      status: {
        isConnected: true,
        flightMode: !this.missionActive ? 'LOITER' : completed ? 'LOITER' : navigationMode === 'RTL' ? 'RTL' : 'AUTO',
        armed: this.missionActive && !completed,
      },
    };

    this.callback(data);
  }

  private getPhase(waypointIndex: number, completed: boolean, navigationMode: string): MissionPhase {
    if (!this.missionActive) return 'PRE_FLIGHT';
    if (completed) return 'LANDING';
    if (navigationMode === 'RTL') return 'RTL';
    if (waypointIndex === 0) return 'PRE_FLIGHT';
    if (waypointIndex === 1) return 'TAKEOFF';
    if (waypointIndex >= this.customWaypoints.length - 2) return 'RTL';
    if (waypointIndex >= 3) return 'ON_STATION';
    return 'EN_ROUTE';
  }
}
