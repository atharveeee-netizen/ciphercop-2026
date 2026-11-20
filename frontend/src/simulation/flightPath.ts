import type { Waypoint, CustomWaypoint } from '../types/telemetry';
import { haversineDistance, calculateBearing, moveToward } from '../utils/geoUtils';
import { MAP_CENTER } from '../utils/constants';

export type NavigationMode = 'MISSION' | 'LOITER' | 'RTL' | 'HOLD';

export interface FlightState {
  lat: number;
  lng: number;
  altitude: number;
  heading: number;
  currentWaypointIndex: number;
  completed: boolean;
  navigationMode: NavigationMode;
  loiterCenter: { lat: number; lng: number } | null;
  loiterRadius: number;
  loiterAngle: number;
}

const STEP_METERS = 5;
const LOITER_STEP_DEGREES = 3;
const DEFAULT_ALTITUDE = 50;

export function initFlightState(): FlightState {
  return {
    lat: MAP_CENTER[0],
    lng: MAP_CENTER[1],
    altitude: DEFAULT_ALTITUDE,
    heading: 0,
    currentWaypointIndex: 0,
    completed: false,
    navigationMode: 'HOLD',
    loiterCenter: null,
    loiterRadius: 50,
    loiterAngle: 0,
  };
}

export function initFlightStateFromWaypoints(waypoints: CustomWaypoint[]): FlightState {
  if (waypoints.length === 0) {
    return initFlightState();
  }
  
  const homeWp = waypoints.find((wp) => wp.type === 'HOME') || waypoints[0];
  return {
    lat: homeWp.lat,
    lng: homeWp.lng,
    altitude: homeWp.altitude,
    heading: 0,
    currentWaypointIndex: 1,
    completed: waypoints.length <= 1,
    navigationMode: 'MISSION',
    loiterCenter: null,
    loiterRadius: 50,
    loiterAngle: 0,
  };
}

function waypointsToWaypointArray(waypoints: CustomWaypoint[]): Waypoint[] {
  return waypoints.map((wp) => ({
    lat: wp.lat,
    lng: wp.lng,
    alt: wp.altitude,
  }));
}

export function advanceFlight(state: FlightState, customWaypoints?: CustomWaypoint[]): FlightState {
  if (state.navigationMode === 'HOLD') {
    return state;
  }
  
  if (state.navigationMode === 'LOITER' && state.loiterCenter) {
    return advanceLoiter(state);
  }
  
  if (state.completed) return state;

  if (!customWaypoints || customWaypoints.length === 0) {
    return { ...state, navigationMode: 'HOLD' };
  }
  
  const waypoints = waypointsToWaypointArray(customWaypoints);
  
  if (state.currentWaypointIndex >= waypoints.length) {
    return { ...state, completed: true };
  }

  const target: Waypoint = waypoints[state.currentWaypointIndex];
  const dist = haversineDistance(state.lat, state.lng, target.lat, target.lng);
  const heading = calculateBearing(state.lat, state.lng, target.lat, target.lng);

  if (dist < 20) {
    const nextIndex = state.currentWaypointIndex + 1;
    
    const currentCustomWp = customWaypoints?.[state.currentWaypointIndex];
    if (currentCustomWp?.type === 'LOITER') {
      return {
        ...state,
        navigationMode: 'LOITER',
        loiterCenter: { lat: target.lat, lng: target.lng },
        loiterRadius: currentCustomWp.loiterRadius || 50,
        loiterAngle: 0,
        heading,
      };
    }
    
    if (nextIndex >= waypoints.length) {
      return { ...state, completed: true, heading };
    }
    return { ...state, currentWaypointIndex: nextIndex, heading };
  }

  const newPos = moveToward(state.lat, state.lng, target.lat, target.lng, STEP_METERS);
  const altDiff = target.alt - state.altitude;
  const altStep = Math.sign(altDiff) * Math.min(Math.abs(altDiff), 2);

  return {
    ...state,
    lat: newPos.lat,
    lng: newPos.lng,
    altitude: state.altitude + altStep,
    heading,
  };
}

function advanceLoiter(state: FlightState): FlightState {
  if (!state.loiterCenter) return state;
  
  const newAngle = (state.loiterAngle + LOITER_STEP_DEGREES) % 360;
  const angleRad = (newAngle * Math.PI) / 180;
  
  const latOffset = (state.loiterRadius * Math.cos(angleRad)) / 111000;
  const lngOffset = (state.loiterRadius * Math.sin(angleRad)) / (111000 * Math.cos(state.loiterCenter.lat * Math.PI / 180));
  
  const newLat = state.loiterCenter.lat + latOffset;
  const newLng = state.loiterCenter.lng + lngOffset;
  const heading = (newAngle + 90) % 360;

  return {
    ...state,
    lat: newLat,
    lng: newLng,
    loiterAngle: newAngle,
    heading,
  };
}

export function startRTL(state: FlightState): FlightState {
  return {
    ...state,
    navigationMode: 'RTL',
    completed: false,
    currentWaypointIndex: 999,
  };
}

export function startLoiter(state: FlightState, center: { lat: number; lng: number }, radius: number): FlightState {
  return {
    ...state,
    navigationMode: 'LOITER',
    loiterCenter: center,
    loiterRadius: radius,
    loiterAngle: 0,
  };
}

export function resumeMission(state: FlightState): FlightState {
  return {
    ...state,
    navigationMode: 'MISSION',
    loiterCenter: null,
  };
}

export function holdPosition(state: FlightState): FlightState {
  return {
    ...state,
    navigationMode: 'HOLD',
  };
}
