import type { SavedRoute, CustomWaypoint } from '../types/telemetry';

const STORAGE_KEY = 'uav_saved_routes';
const MAX_SAVED_ROUTES = 10;

export function getSavedRoutes(): SavedRoute[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as SavedRoute[];
  } catch {
    return [];
  }
}

export function saveRoute(name: string, waypoints: CustomWaypoint[]): SavedRoute | null {
  if (waypoints.length === 0) return null;
  
  const routes = getSavedRoutes();
  
  const newRoute: SavedRoute = {
    id: `route_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    createdAt: Date.now(),
    waypoints,
  };
  
  const updatedRoutes = [newRoute, ...routes].slice(0, MAX_SAVED_ROUTES);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRoutes));
    return newRoute;
  } catch {
    return null;
  }
}

export function deleteRoute(id: string): boolean {
  const routes = getSavedRoutes();
  const updatedRoutes = routes.filter((r) => r.id !== id);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRoutes));
    return true;
  } catch {
    return false;
  }
}

export function exportRouteToJSON(route: SavedRoute): string {
  return JSON.stringify(route, null, 2);
}

export function importRouteFromJSON(json: string): SavedRoute | null {
  try {
    const data = JSON.parse(json);
    if (!data.waypoints || !Array.isArray(data.waypoints)) return null;
    return data as SavedRoute;
  } catch {
    return null;
  }
}
