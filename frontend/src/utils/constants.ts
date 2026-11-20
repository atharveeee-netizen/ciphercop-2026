export const MAP_CENTER: [number, number] = [39.9334, 32.8597];
export const MAP_ZOOM = 14;
export const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export const MAX_ALTITUDE = 200;
export const MAX_SPEED = 30;
export const MAX_FLIGHT_PATH_POINTS = 200;
export const MAX_HISTORY_POINTS = 120;
export const MAX_ALERTS = 10;

export const UPDATE_INTERVAL_POSITION = 500;
export const UPDATE_INTERVAL_SENSORS = 1000;
export const UPDATE_INTERVAL_BATTERY = 2000;

export const GEOFENCE = {
  center: { lat: 39.9390, lng: 32.8630 },
  radius: 800,
};

export const COLORS = {
  cyan: '#00e5ff',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  bgPrimary: '#0a0e17',
  bgPanel: '#111827',
  border: '#1e293b',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
} as const;

export const MISSION_PHASES = [
  'PRE_FLIGHT',
  'TAKEOFF',
  'EN_ROUTE',
  'ON_STATION',
  'RTL',
  'LANDING',
] as const;

export const MISSION_PHASE_LABELS: Record<string, string> = {
  PRE_FLIGHT: 'PRE-FLIGHT',
  TAKEOFF: 'TAKEOFF',
  EN_ROUTE: 'EN ROUTE',
  ON_STATION: 'ON STATION',
  RTL: 'RTL',
  LANDING: 'LANDING',
};
