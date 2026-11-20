import { memo } from 'react';
import { Circle } from 'react-leaflet';
import { GEOFENCE } from '../../utils/constants';
import { useTelemetryStore } from '../../store/telemetryStore';
import { haversineDistance } from '../../utils/geoUtils';

export const Geofence = memo(function Geofence() {
  const lat = useTelemetryStore((s) => s.currentData?.position.latitude ?? 0);
  const lng = useTelemetryStore((s) => s.currentData?.position.longitude ?? 0);

  const dist = haversineDistance(lat, lng, GEOFENCE.center.lat, GEOFENCE.center.lng);
  const isNear = dist > GEOFENCE.radius * 0.7;

  return (
    <Circle
      center={[GEOFENCE.center.lat, GEOFENCE.center.lng]}
      radius={GEOFENCE.radius}
      pathOptions={{
        color: '#ef4444',
        opacity: isNear ? 0.8 : 0.3,
        weight: isNear ? 3 : 1,
        dashArray: '8 6',
        fillOpacity: 0.02,
        fillColor: '#ef4444',
      }}
    />
  );
});
