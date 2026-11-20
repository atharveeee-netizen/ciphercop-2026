import { memo, useEffect, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useRouteStore } from '../../store/routeStore';
import { MapToolbar } from './MapToolbar';
import { PlannedRoute } from './PlannedRoute';
import { RouteInfoBar } from './RouteInfoBar';
import { WaypointMarker } from './WaypointMarker';
import { WaypointContextMenu } from './WaypointContextMenu';
import L from 'leaflet';

type ContextMenuState = {
  waypointId: string;
  x: number;
  y: number;
} | null;

export const RouteEditor = memo(function RouteEditor() {
  const map = useMap();
  const { isEditingMode, addWaypoint, waypoints } = useRouteStore();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isEditingMode) {
        L.DomEvent.stopPropagation(e);
        addWaypoint(e.latlng.lat, e.latlng.lng);
      }
    };
    
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, isEditingMode, addWaypoint]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleWaypointContextMenu = useCallback((waypointId: string, e: L.LeafletMouseEvent) => {
    const container = map.getContainer();
    const rect = container.getBoundingClientRect();
    const point = map.latLngToContainerPoint(e.latlng);
    
    setContextMenu({
      waypointId,
      x: rect.left + point.x,
      y: rect.top + point.y,
    });
  }, [map]);

  return (
    <>
      <MapToolbar />
      <PlannedRoute />
      {waypoints.map((wp) => (
        <WaypointMarker 
          key={wp.id} 
          waypoint={wp} 
          onContextMenu={handleWaypointContextMenu}
        />
      ))}
      <RouteInfoBar />
      {contextMenu && (
        <WaypointContextMenu
          waypointId={contextMenu.waypointId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
});
