import { memo } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { GaugeCard } from './GaugeCard';
import { formatNumber } from '../../utils/formatters';
import { MAX_SPEED } from '../../utils/constants';

export const SpeedGauge = memo(function SpeedGauge() {
  const speed = useTelemetryStore((s) => s.currentData?.velocity.groundSpeed ?? 0);

  return (
    <GaugeCard
      label="SPD"
      value={formatNumber(speed)}
      unit="m/s"
      subText="GND SPD"
      barValue={speed}
      barMax={MAX_SPEED}
      color="text-cyan-400"
      ariaLabel={`Speed: ${formatNumber(speed)} meters per second`}
    />
  );
});
