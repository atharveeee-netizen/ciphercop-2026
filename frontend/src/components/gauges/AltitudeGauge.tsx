import { memo } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { GaugeCard } from './GaugeCard';
import { formatNumber } from '../../utils/formatters';
import { MAX_ALTITUDE } from '../../utils/constants';

export const AltitudeGauge = memo(function AltitudeGauge() {
  const altitude = useTelemetryStore((s) => s.currentData?.position.altitude ?? 0);
  const isHigh = altitude > MAX_ALTITUDE * 0.8;

  return (
    <GaugeCard
      label="ALT"
      value={formatNumber(altitude)}
      unit="m"
      subText={isHigh ? `MAX: ${MAX_ALTITUDE}m` : undefined}
      warningColor={isHigh ? '#f59e0b' : undefined}
      barValue={altitude}
      barMax={MAX_ALTITUDE}
      barVertical
      ariaLabel={`Altitude: ${formatNumber(altitude)} meters`}
    />
  );
});
