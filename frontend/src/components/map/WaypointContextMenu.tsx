import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouteStore } from '../../store/routeStore';
import type { WaypointType } from '../../types/telemetry';

interface ContextMenuProps {
  waypointId: string;
  x: number;
  y: number;
  onClose: () => void;
}

const WAYPOINT_TYPE_OPTIONS: { type: WaypointType; label: string; description: string }[] = [
  { type: 'WAYPOINT', label: 'Waypoint', description: 'Geçiş noktası' },
  { type: 'LOITER', label: 'Loiter', description: 'Bekleme noktası' },
  { type: 'LAND', label: 'Land', description: 'İniş noktası' },
];

export const WaypointContextMenu = memo(function WaypointContextMenu({ waypointId, x, y, onClose }: ContextMenuProps) {
  const { waypoints, updateWaypoint, removeWaypoint } = useRouteStore();
  const waypoint = waypoints.find((wp) => wp.id === waypointId);
  
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  
  const handleTypeChange = useCallback((type: WaypointType) => {
    updateWaypoint(waypointId, { type });
    setShowTypeSelector(false);
    onClose();
  }, [waypointId, updateWaypoint, onClose]);
  
  const handleDelete = useCallback(() => {
    removeWaypoint(waypointId);
    onClose();
  }, [waypointId, removeWaypoint, onClose]);
  
  if (!waypoint) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-[9999] bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl overflow-hidden"
        style={{ left: x, top: y }}
      >
        {!showTypeSelector ? (
          <div className="py-1 min-w-[160px]">
            <button
              onClick={() => setShowTypeSelector(true)}
              className="w-full px-3 py-2 text-left text-xs font-mono text-slate-300 hover:bg-slate-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Tip Değiştir
            </button>
            
            {waypoint.type === 'LOITER' && (
              <div className="px-3 py-2 border-t border-slate-700/50">
                <label className="text-[10px] text-slate-500 block mb-1">Daire Çapı (m)</label>
                <input
                  type="number"
                  value={waypoint.loiterRadius || 50}
                  onChange={(e) => updateWaypoint(waypointId, { loiterRadius: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs font-mono text-slate-200"
                  min={10}
                  max={500}
                />
              </div>
            )}
            
            <div className="border-t border-slate-700/50 mt-1 pt-1">
              <button
                onClick={handleDelete}
                disabled={waypoint.type === 'HOME'}
                className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center gap-2 ${
                  waypoint.type === 'HOME'
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-red-400 hover:bg-red-500/10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Sil
              </button>
            </div>
          </div>
        ) : (
          <div className="py-1 min-w-[160px]">
            <button
              onClick={() => setShowTypeSelector(false)}
              className="w-full px-3 py-2 text-left text-xs font-mono text-slate-400 hover:bg-slate-800 flex items-center gap-2 border-b border-slate-700/50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </button>
            {WAYPOINT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => handleTypeChange(option.type)}
                className={`w-full px-3 py-2 text-left text-xs font-mono hover:bg-slate-800 flex flex-col ${
                  waypoint.type === option.type ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-300'
                }`}
              >
                <span>{option.label}</span>
                <span className="text-[10px] text-slate-500">{option.description}</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});
