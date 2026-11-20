import { memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTelemetryStore } from '../../store/telemetryStore';
import { formatNumber } from '../../utils/formatters';

function createDroneIcon(heading: number) {
  const svg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(${heading}, 16, 16)">
      <polygon points="16,4 22,26 16,22 10,26" fill="#00e5ff" opacity="0.9" stroke="#00e5ff" stroke-width="0.5"/>
    </g>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export const DroneMarker = memo(function DroneMarker() {
  const lat = useTelemetryStore((s) => s.currentData?.position.latitude ?? 39.9334);
  const lng = useTelemetryStore((s) => s.currentData?.position.longitude ?? 32.8597);
  const heading = useTelemetryStore((s) => s.currentData?.attitude.heading ?? 0);
  const alt = useTelemetryStore((s) => s.currentData?.position.altitude ?? 0);
  const spd = useTelemetryStore((s) => s.currentData?.velocity.groundSpeed ?? 0);

  const icon = useMemo(() => createDroneIcon(heading), [heading]);

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Popup>
        <div className="text-xs font-mono">
          <div>ALT: {formatNumber(alt)}m</div>
          <div>SPD: {formatNumber(spd)} m/s</div>
          <div>HDG: {formatNumber(heading, 0)}&deg;</div>
        </div>
      </Popup>
    </Marker>
  );
});
