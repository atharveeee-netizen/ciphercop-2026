export type MissionPhase = 'PRE_FLIGHT' | 'TAKEOFF' | 'EN_ROUTE' | 'ON_STATION' | 'RTL' | 'LANDING';
export type FlightMode = 'AUTO' | 'MANUAL' | 'RTL' | 'LOITER';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface TelemetryData {
  timestamp: number;
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  attitude: {
    pitch: number;
    roll: number;
    heading: number;
  };
  velocity: {
    groundSpeed: number;
    verticalSpeed: number;
  };
  battery: {
    percentage: number;
    voltage: number;
    estimatedFlightTime: number;
  };
  sensors: {
    temperature: number;
    pressure: number;
    windSpeed: number;
    satellites: number;
    hdop: number;
    rssi: number;
  };
  mission: {
    currentWaypoint: number;
    totalWaypoints: number;
    phase: MissionPhase;
    progress: number;
  };
  status: {
    isConnected: boolean;
    flightMode: FlightMode;
    armed: boolean;
  };
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  message: string;
}

export interface Waypoint {
  lat: number;
  lng: number;
  alt: number;
}

export type WaypointType = 'HOME' | 'TAKEOFF' | 'WAYPOINT' | 'LOITER' | 'LAND';

export interface CustomWaypoint {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  type: WaypointType;
  loiterRadius?: number;
  loiterTime?: number;
  order: number;
}

export interface SavedRoute {
  id: string;
  name: string;
  createdAt: number;
  waypoints: CustomWaypoint[];
}

export interface HistoryPoint {
  time: number;
  value: number;
}
