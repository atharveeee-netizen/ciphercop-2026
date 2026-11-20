import { memo } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { GaugeCard } from './GaugeCard';
import { formatNumber, headingToCardinal } from '../../utils/formatters';

function CompassIcon({ heading }: { heading: number }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="none" stroke="#334155" strokeWidth="1" />
      <g transform={`rotate(${heading}, 14, 14)`}>
        <polygon points="14,4 16,14 14,12 12,14" fill="#00e5ff" opacity="0.8" />
        <polygon points="14,24 16,14 14,16 12,14" fill="#64748b" opacity="0.5" />
      </g>
      <circle cx="14" cy="14" r="1.5" fill="#00e5ff" />
    </svg>
  );
}

export const HeadingGauge = memo(function HeadingGauge() {
  const heading = useTelemetryStore((s) => s.currentData?.attitude.heading ?? 0);

  return (
    <GaugeCard
      label="HDG"
      value={`${formatNumber(heading, 0)}\u00B0`}
      subText={headingToCardinal(heading)}
      icon={<CompassIcon heading={heading} />}
      ariaLabel={`Heading: ${formatNumber(heading, 0)} degrees ${headingToCardinal(heading)}`}
    />
  );
});
