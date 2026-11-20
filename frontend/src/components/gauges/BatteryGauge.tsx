import { memo } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { GaugeCard } from './GaugeCard';
import { formatNumber } from '../../utils/formatters';

function BatteryIcon({ percent }: { percent: number }) {
  const fillColor = percent > 50 ? '#22c55e' : percent > 20 ? '#f59e0b' : '#ef4444';
  const fillHeight = (percent / 100) * 16;

  return (
    <svg width="20" height="28" viewBox="0 0 20 28">
      <rect x="5" y="0" width="10" height="3" rx="1" fill="#475569" />
      <rect x="2" y="3" width="16" height="24" rx="2" fill="none" stroke="#475569" strokeWidth="1.5" />
      <rect
        x="4"
        y={27 - fillHeight - 2}
        width="12"
        height={fillHeight}
        rx="1"
        fill={fillColor}
        opacity="0.8"
        className={percent < 20 ? 'animate-blink' : ''}
      />
    </svg>
  );
}

export const BatteryGauge = memo(function BatteryGauge() {
  const percentage = useTelemetryStore((s) => s.currentData?.battery.percentage ?? 0);
  const estTime = useTelemetryStore((s) => s.currentData?.battery.estimatedFlightTime ?? 0);
  const estMin = Math.round(estTime / 60);

  const color = percentage > 50 ? 'text-green-400' : percentage > 20 ? 'text-amber-400' : 'text-red-400';
  const warningColor = percentage > 50 ? '#22c55e' : percentage > 20 ? '#f59e0b' : '#ef4444';

  return (
    <GaugeCard
      label="BAT"
      value={formatNumber(percentage, 0)}
      unit="%"
      subText={`EST: ${estMin}min`}
      color={color}
      warningColor={warningColor}
      icon={<BatteryIcon percent={percentage} />}
      ariaLabel={`Battery: ${formatNumber(percentage, 0)} percent`}
    />
  );
});
