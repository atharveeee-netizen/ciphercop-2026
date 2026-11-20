import { memo, useCallback } from 'react';
import { Marker, Tooltip, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useRouteStore } from '../../store/routeStore';
import type { CustomWaypoint, WaypointType } from '../../types/telemetry';

interface WaypointMarkerProps {
  waypoint: CustomWaypoint;
  isEditable?: boolean;
  onContextMenu?: (waypointId: string, e: L.LeafletMouseEvent) => void;
}

const WAYPOINT_COLORS: Record<WaypointType, string> = {
  HOME: '#22c55e',
  TAKEOFF: '#22c55e',
  WAYPOINT: '#3b82f6',
  LOITER: '#f59e0b',
  LAND: '#ef4444',
};

const WAYPOINT_LABELS: Record<WaypointType, string> = {
  HOME: 'H',
  TAKEOFF: 'T',
  WAYPOINT: 'W',
  LOITER: 'L',
  LAND: 'D',
};

function createWaypointIcon(type: WaypointType, order: number, isActive: boolean): L.DivIcon {
  const color = WAYPOINT_COLORS[type];
  const label = type === 'HOME' || type === 'TAKEOFF' || type === 'LAND' 
    ? WAYPOINT_LABELS[type] 
    : String(order);
  
  const size = isActive ? 28 : 24;
  const borderWidth = isActive ? 3 : 2;
  
  return L.divIcon({
    className: 'waypoint-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: ${borderWidth}px solid ${isActive ? '#00e5ff' : '#fff'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: bold;
        color: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: grab;
      ">${label}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export const WaypointMarker = memo(function WaypointMarker({ waypoint, isEditable = true, onContextMenu }: WaypointMarkerProps) {
  const { activeWaypointId, setActiveWaypoint, updateWaypoint } = useRouteStore();
  
  const isActive = activeWaypointId === waypoint.id;
  const icon = createWaypointIcon(waypoint.type, waypoint.order, isActive);

  const handleClick = useCallback((e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    setActiveWaypoint(isActive ? null : waypoint.id);
  }, [isActive, waypoint.id, setActiveWaypoint]);

  const handleDragEnd = useCallback((e: L.DragEndEvent) => {
    const marker = e.target as L.Marker;
    const pos = marker.getLatLng();
    updateWaypoint(waypoint.id, { lat: pos.lat, lng: pos.lng });
  }, [waypoint.id, updateWaypoint]);

  const handleContextMenu = useCallback((e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    onContextMenu?.(waypoint.id, e);
  }, [waypoint.id, onContextMenu]);

  return (
    <>
      {waypoint.type === 'LOITER' && waypoint.loiterRadius && (
        <Circle
          center={[waypoint.lat, waypoint.lng]}
          radius={waypoint.loiterRadius}
          pathOptions={{
            color: WAYPOINT_COLORS.LOITER,
            fillColor: WAYPOINT_COLORS.LOITER,
            fillOpacity: 0.1,
            weight: 1,
            dashArray: '4 4',
          }}
        />
      )}
      <Marker
        position={[waypoint.lat, waypoint.lng]}
        icon={icon}
        draggable={isEditable}
        eventHandlers={{
          click: handleClick,
          dragend: handleDragEnd,
          contextmenu: handleContextMenu,
        }}
      >
        <Tooltip
          direction="top"
          offset={[0, -16]}
          className="!bg-slate-900 !text-slate-200 !border-slate-700 !text-xs !font-mono !px-2 !py-1"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-cyan-400">{waypoint.type}</span>
            <span>Alt: {waypoint.altitude}m</span>
            {waypoint.type === 'LOITER' && waypoint.loiterRadius && (
              <span>Radius: {waypoint.loiterRadius}m</span>
            )}
          </div>
        </Tooltip>
      </Marker>
    </>
  );
});
