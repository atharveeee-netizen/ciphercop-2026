import { memo } from 'react';
import { Polyline } from 'react-leaflet';
import { useTelemetryStore } from '../../store/telemetryStore';

export const FlightPath = memo(function FlightPath() {
  const path = useTelemetryStore((s) => s.flightPath);

  if (path.length < 2) return null;

  return (
    <Polyline
      positions={path}
      pathOptions={{ color: '#00e5ff', opacity: 0.6, weight: 2 }}
    />
  );
});
