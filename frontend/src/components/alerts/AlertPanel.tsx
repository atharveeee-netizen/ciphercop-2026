import { memo } from 'react';
import { useAlerts } from '../../hooks/useAlerts';
import { AlertItem } from './AlertItem';

export const AlertPanel = memo(function AlertPanel() {
  const { alerts } = useAlerts();
  const hasAlerts = alerts.length > 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded p-3 flex flex-col" aria-live="polite">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">alerts</span>
        {hasAlerts && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-blink" />}
        <span className="text-[10px] font-mono text-slate-600 ml-auto">{alerts.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto max-h-32 space-y-0">
        {alerts.length === 0 ? (
          <span className="text-[10px] font-mono text-slate-600">No active alerts</span>
        ) : (
          alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
});
