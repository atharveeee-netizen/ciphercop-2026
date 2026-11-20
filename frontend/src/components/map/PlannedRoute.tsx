import { memo, useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { useRouteStore } from '../../store/routeStore';
import type { LatLngTuple } from 'leaflet';

export const PlannedRoute = memo(function PlannedRoute() {
  const waypoints = useRouteStore((s) => s.waypoints);
  
  const routePositions: LatLngTuple[] = useMemo(
    () => waypoints.map((wp) => [wp.lat, wp.lng] as LatLngTuple),
    [waypoints]
  );
  
  if (routePositions.length < 2) return null;

  return (
    <>
      <Polyline
        positions={routePositions}
        pathOptions={{
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8,
          dashArray: '8 4',
        }}
      />
      {routePositions.length >= 2 && (
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: '#3b82f6',
            weight: 6,
            opacity: 0.15,
          }}
        />
      )}
    </>
  );
});
