import { create } from 'zustand';
import type { CustomWaypoint, WaypointType } from '../types/telemetry';
import { calculateRouteDistance, generateWaypointId } from '../utils/geoUtils';

interface RouteState {
  waypoints: CustomWaypoint[];
  activeWaypointId: string | null;
  editingWaypointId: string | null;
  isEditingMode: boolean;
  
  totalDistance: number;
  estimatedDuration: number;
  
  addWaypoint: (lat: number, lng: number, type?: WaypointType) => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, updates: Partial<CustomWaypoint>) => void;
  reorderWaypoints: (fromIndex: number, toIndex: number) => void;
  clearRoute: () => void;
  
  setActiveWaypoint: (id: string | null) => void;
  setEditingWaypoint: (id: string | null) => void;
  setEditingMode: (enabled: boolean) => void;
}

const DEFAULT_ALTITUDE = 100;
const AVG_SPEED_MS = 12;

function recalculateMetrics(waypoints: CustomWaypoint[]): { distance: number; duration: number } {
  const distance = calculateRouteDistance(waypoints);
  const duration = distance / AVG_SPEED_MS;
  return { distance, duration };
}

export const useRouteStore = create<RouteState>((set, get) => ({
  waypoints: [],
  activeWaypointId: null,
  editingWaypointId: null,
  isEditingMode: false,
  totalDistance: 0,
  estimatedDuration: 0,

  addWaypoint: (lat, lng, type = 'WAYPOINT') => {
    const { waypoints } = get();
    const isFirst = waypoints.length === 0;
    const waypointType: WaypointType = isFirst ? 'HOME' : type;
    
    const newWaypoint: CustomWaypoint = {
      id: generateWaypointId(),
      lat,
      lng,
      altitude: DEFAULT_ALTITUDE,
      type: waypointType,
      order: waypoints.length,
    };
    
    const updated = [...waypoints, newWaypoint];
    const { distance, duration } = recalculateMetrics(updated);
    
    set({ waypoints: updated, totalDistance: distance, estimatedDuration: duration });
  },

  removeWaypoint: (id) => {
    const { waypoints } = get();
    const filtered = waypoints.filter((wp) => wp.id !== id);
    const reordered = filtered.map((wp, idx) => ({ ...wp, order: idx }));
    const { distance, duration } = recalculateMetrics(reordered);
    
    set({ 
      waypoints: reordered, 
      totalDistance: distance, 
      estimatedDuration: duration,
      activeWaypointId: null,
      editingWaypointId: null,
    });
  },

  updateWaypoint: (id, updates) => {
    const { waypoints } = get();
    const updated = waypoints.map((wp) => 
      wp.id === id ? { ...wp, ...updates } : wp
    );
    const { distance, duration } = recalculateMetrics(updated);
    
    set({ waypoints: updated, totalDistance: distance, estimatedDuration: duration });
  },

  reorderWaypoints: (fromIndex, toIndex) => {
    const { waypoints } = get();
    if (fromIndex === toIndex) return;
    
    const reordered = [...waypoints];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    
    const finalReordered = reordered.map((wp, idx) => ({ ...wp, order: idx }));
    const { distance, duration } = recalculateMetrics(finalReordered);
    
    set({ waypoints: finalReordered, totalDistance: distance, estimatedDuration: duration });
  },

  clearRoute: () => {
    set({ 
      waypoints: [], 
      totalDistance: 0, 
      estimatedDuration: 0,
      activeWaypointId: null,
      editingWaypointId: null,
    });
  },

  setActiveWaypoint: (id) => set({ activeWaypointId: id }),
  setEditingWaypoint: (id) => set({ editingWaypointId: id }),
  setEditingMode: (enabled) => set({ isEditingMode: enabled }),
}));
