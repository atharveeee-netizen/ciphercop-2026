import { useCallback } from 'react';
import { getTelemetryEngine } from './useTelemetry';
import { useRouteStore } from '../store/routeStore';
import { useTelemetryStore } from '../store/telemetryStore';

export function useNavigation() {
  const { waypoints, clearRoute } = useRouteStore();
  const currentData = useTelemetryStore((s) => s.currentData);

  const setCustomRoute = useCallback(() => {
    const engine = getTelemetryEngine();
    if (!engine || waypoints.length === 0) return false;
    
    engine.setCustomWaypoints(waypoints);
    return true;
  }, [waypoints]);

  const clearCustomRoute = useCallback(() => {
    const engine = getTelemetryEngine();
    if (!engine) return;
    
    engine.clearCustomWaypoints();
    clearRoute();
  }, [clearRoute]);

  const startMission = useCallback(() => {
    return setCustomRoute();
  }, [setCustomRoute]);

  const abortMission = useCallback(() => {
    clearCustomRoute();
  }, [clearCustomRoute]);

  const canStartMission = waypoints.length >= 2;

  return {
    waypoints,
    currentData,
    canStartMission,
    startMission,
    abortMission,
    clearRoute,
    setCustomRoute,
  };
}
