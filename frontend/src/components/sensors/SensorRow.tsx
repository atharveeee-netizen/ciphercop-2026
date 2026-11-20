import { memo } from 'react';

interface SensorRowProps {
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export const SensorRow = memo(function SensorRow({ label, value, unit, status }: SensorRowProps) {
  const valueColor = status === 'critical' ? 'text-red-400' : status === 'warning' ? 'text-amber-400' : 'text-slate-200';

  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-800/50 last:border-0">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-mono font-tabular ${valueColor}`}>
        {value} <span className="text-slate-600">{unit}</span>
      </span>
    </div>
  );
});
