import { memo } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { SensorRow } from './SensorRow';
import { formatNumber } from '../../utils/formatters';

type Status = 'normal' | 'warning' | 'critical';

function getStatus(value: number, min: number, max: number): Status {
  if (value < min * 0.8 || value > max * 1.2) return 'critical';
  if (value < min || value > max) return 'warning';
  return 'normal';
}

function getRssiStatus(value: number): Status {
  if (value < -85) return 'critical';
  if (value < -75) return 'warning';
  return 'normal';
}

export const SensorPanel = memo(function SensorPanel() {
  const sensors = useTelemetryStore((s) => s.currentData?.sensors);

  if (!sensors) return null;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded p-3">
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 block">sensors</span>
      <SensorRow label="TEMP" value={formatNumber(sensors.temperature)} unit="°C" status={getStatus(sensors.temperature, 15, 35)} />
      <SensorRow label="PRES" value={formatNumber(sensors.pressure, 0)} unit="hPa" status={getStatus(sensors.pressure, 1000, 1030)} />
      <SensorRow label="WIND" value={formatNumber(sensors.windSpeed)} unit="m/s" status={getStatus(sensors.windSpeed, 0, 15)} />
      <SensorRow label="SATS" value={formatNumber(sensors.satellites, 0)} unit="" status={getStatus(sensors.satellites, 8, 16)} />
      <SensorRow label="HDOP" value={formatNumber(sensors.hdop, 2)} unit="" status={getStatus(sensors.hdop, 0.5, 2.0)} />
      <SensorRow label="RSSI" value={formatNumber(sensors.rssi, 0)} unit="dBm" status={getRssiStatus(sensors.rssi)} />
    </div>
  );
});
