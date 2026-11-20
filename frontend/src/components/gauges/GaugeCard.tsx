import { memo, useRef, useEffect, type ReactNode } from 'react';

interface GaugeCardProps {
  label: string;
  value: string;
  unit?: string;
  subText?: string;
  color?: string;
  warningColor?: string;
  barValue?: number;
  barMax?: number;
  barVertical?: boolean;
  icon?: ReactNode;
  ariaLabel: string;
}

export const GaugeCard = memo(function GaugeCard({
  label,
  value,
  unit,
  subText,
  color = 'text-cyan-400',
  warningColor,
  barValue,
  barMax,
  barVertical,
  icon,
  ariaLabel,
}: GaugeCardProps) {
  const valueRef = useRef(value);
  const glowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (valueRef.current !== value && glowRef.current) {
      glowRef.current.classList.remove('glow-pulse');
      void glowRef.current.offsetWidth;
      glowRef.current.classList.add('glow-pulse');
      valueRef.current = value;
    }
  }, [value]);

  const barPercent = barValue !== undefined && barMax ? Math.min(100, (barValue / barMax) * 100) : 0;

  return (
    <div
      className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded p-3 flex flex-col gap-1 hover:border-cyan-900/50 hover:scale-[1.02] transition-all duration-200"
      role="meter"
      aria-label={ariaLabel}
      aria-valuenow={parseFloat(value) || 0}
    >
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</span>
      <div className="flex items-end gap-2">
        <div className="flex items-baseline gap-1 flex-1 min-w-0">
          <span ref={glowRef} className={`text-2xl font-mono font-semibold font-tabular ${color}`}>
            {value}
          </span>
          {unit && <span className="text-xs text-slate-500 font-mono">{unit}</span>}
        </div>
        {icon && <div className="flex-shrink-0">{icon}</div>}
        {barValue !== undefined && barMax && !barVertical && (
          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${barPercent}%`,
                backgroundColor: warningColor ?? '#00e5ff',
              }}
            />
          </div>
        )}
      </div>
      {barValue !== undefined && barMax && barVertical && (
        <div className="w-1.5 h-8 bg-slate-800 rounded-full overflow-hidden self-end mt-[-2rem]">
          <div
            className="w-full rounded-full transition-all duration-300"
            style={{
              height: `${barPercent}%`,
              backgroundColor: warningColor ?? '#00e5ff',
              marginTop: `${100 - barPercent}%`,
            }}
          />
        </div>
      )}
      {subText && (
        <span className={`text-[10px] font-mono ${warningColor ? `text-[${warningColor}]` : 'text-slate-500'}`}>
          {subText}
        </span>
      )}
    </div>
  );
});
