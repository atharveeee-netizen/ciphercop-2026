import { memo, useState } from 'react';
import { AltitudeChart } from './AltitudeChart';
import { SpeedChart } from './SpeedChart';

const TABS = ['ALTITUDE', 'SPEED'] as const;

export const TelemetryCharts = memo(function TelemetryCharts() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('ALTITUDE');

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded p-3 flex flex-col h-full">
      <div className="flex gap-1 mb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded transition-colors ${
              activeTab === tab
                ? 'bg-slate-800 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        {activeTab === 'ALTITUDE' ? <AltitudeChart /> : <SpeedChart />}
      </div>
    </div>
  );
});
