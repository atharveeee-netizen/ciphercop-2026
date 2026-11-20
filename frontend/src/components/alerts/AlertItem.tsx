import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Alert } from '../../types/telemetry';
import { formatTimestamp } from '../../utils/formatters';

interface AlertItemProps {
  alert: Alert;
}

export const AlertItem = memo(function AlertItem({ alert }: AlertItemProps) {
  const severityConfig = {
    CRITICAL: { dot: 'bg-red-500 animate-blink', text: 'text-red-400', bg: 'bg-red-950/30' },
    WARNING: { dot: 'bg-amber-500', text: 'text-amber-400', bg: '' },
    INFO: { dot: 'bg-blue-500', text: 'text-blue-400', bg: '' },
  };

  const config = severityConfig[alert.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      className={`flex items-start gap-2 py-1.5 px-1 border-b border-slate-800/50 last:border-0 rounded ${config.bg}`}
      role="alert"
    >
      <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${config.dot}`} />
      <span className="text-[9px] font-mono text-slate-600 flex-shrink-0 mt-0.5">
        {formatTimestamp(alert.timestamp)}
      </span>
      <span className={`text-[10px] font-mono ${config.text}`}>
        {alert.message}
      </span>
    </motion.div>
  );
});
