import { memo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MAP_CENTER, MAP_ZOOM, MAP_TILE_URL } from '../../utils/constants';
import { DroneMarker } from './DroneMarker';
import { FlightPath } from './FlightPath';
import { Waypoints } from './Waypoints';
import { Geofence } from './Geofence';
import { RouteEditor } from './RouteEditor';
import 'leaflet/dist/leaflet.css';

export const TelemetryMap = memo(function TelemetryMap() {
  return (
    <div className="w-full h-full rounded border border-slate-700/50 overflow-hidden relative">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={MAP_TILE_URL} />
        <Geofence />
        <Waypoints />
        <FlightPath />
        <DroneMarker />
        <RouteEditor />
      </MapContainer>
    </div>
  );
});
