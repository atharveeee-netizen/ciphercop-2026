import { memo } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { MISSION_PHASES, MISSION_PHASE_LABELS } from '../../utils/constants';

export const MissionStatusBar = memo(function MissionStatusBar() {
  const phase = useTelemetryStore((s) => s.currentData?.mission.phase ?? 'PRE_FLIGHT');
  const progress = useTelemetryStore((s) => s.currentData?.mission.progress ?? 0);

  const currentIndex = MISSION_PHASES.indexOf(phase);

  return (
    <footer className="h-14 flex items-center px-4 bg-[#111827]/90 backdrop-blur-sm border-t border-slate-800">
      <div className="flex-1 flex items-center gap-1">
        {MISSION_PHASES.map((p, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={p} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                    isDone
                      ? 'bg-cyan-400 border-cyan-400'
                      : isActive
                        ? 'bg-cyan-400 border-cyan-400 animate-pulse-dot shadow-[0_0_8px_rgba(0,229,255,0.6)]'
                        : 'bg-transparent border-slate-600'
                  }`}
                />
                <span
                  className={`text-[9px] font-mono mt-1 whitespace-nowrap ${
                    isDone || isActive ? 'text-cyan-400' : 'text-slate-600'
                  }`}
                >
                  {MISSION_PHASE_LABELS[p]}
                </span>
              </div>
              {i < MISSION_PHASES.length - 1 && (
                <div
                  className={`w-8 sm:w-12 lg:w-16 h-0.5 mx-1 ${
                    isDone ? 'bg-cyan-400' : isFuture ? 'border-t border-dashed border-slate-600' : 'bg-slate-600'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="ml-4 text-right">
        <span className="text-xs font-mono text-slate-400">
          MISSION PROGRESS:{' '}
          <span className="text-cyan-400">{progress}%</span>
        </span>
      </div>
    </footer>
  );
});
