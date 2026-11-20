import { memo, useState, useEffect } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { useFlightTimer } from '../../hooks/useFlightTimer';
import { formatUTC } from '../../utils/formatters';

export const Header = memo(function Header() {
  const isConnected = useTelemetryStore((s) => s.currentData?.status.isConnected ?? false);
  const isRunning = useTelemetryStore((s) => s.isSimulationRunning);
  const { formattedTime } = useFlightTimer(isRunning);
  const [utc, setUtc] = useState(formatUTC());

  useEffect(() => {
    const id = setInterval(() => setUtc(formatUTC()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-12 flex items-center justify-between px-4 bg-[#111827]/90 backdrop-blur-sm border-b border-slate-800">
      <div className="flex items-center gap-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
          <path d="M12 2L4 7v4l8 5 8-5V7l-8-5z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M12 12v10M4 11l8 5 8-5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="7" r="2" fill="currentColor" />
        </svg>
        <span className="font-mono text-sm font-semibold tracking-widest text-slate-200">UAV TELEMETRY</span>
        <span className="bg-slate-800 text-cyan-400 px-2 py-0.5 rounded text-xs font-mono">DRONE-01</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse-dot' : 'bg-red-500 animate-blink'}`} />
          <span className={`text-xs font-mono ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        <span className="text-xs font-mono text-slate-400">
          FLIGHT TIME: <span className="text-slate-200">{formattedTime}</span>
        </span>

        <span className="text-xs font-mono text-slate-400">{utc}</span>
      </div>
    </header>
  );
});
