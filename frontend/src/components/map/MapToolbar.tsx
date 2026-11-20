import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouteStore } from '../../store/routeStore';
import { useNavigation } from '../../hooks/useNavigation';
import { SavedRoutesDropdown } from './SavedRoutesDropdown';

export const MapToolbar = memo(function MapToolbar() {
  const { isEditingMode, setEditingMode, waypoints, clearRoute } = useRouteStore();
  const { startMission, abortMission, canStartMission } = useNavigation();
  const [missionActive, setMissionActive] = useState(false);
  
  const hasWaypoints = waypoints.length > 0;

  const handleStartMission = () => {
    if (startMission()) {
      setMissionActive(true);
      setEditingMode(false);
    }
  };

  const handleAbortMission = () => {
    abortMission();
    setMissionActive(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-3 left-3 z-[1000] flex gap-2"
    >
      <div className="flex bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50 p-1">
        <button
          onClick={() => setEditingMode(!isEditingMode)}
          disabled={missionActive}
          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
            missionActive
              ? 'text-slate-600 cursor-not-allowed'
              : isEditingMode
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isEditingMode ? 'Düzenleme Açık' : 'Rota Ekle'}
        </button>
        
        <div className="w-px bg-slate-700 mx-1" />
        
        <SavedRoutesDropdown />
        
        {hasWaypoints && !missionActive && (
          <>
            <div className="w-px bg-slate-700 mx-1" />
            
            <button
              onClick={handleStartMission}
              disabled={!canStartMission}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                canStartMission
                  ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10 border border-green-500/30'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rotaya Git
            </button>
            
            <button
              onClick={clearRoute}
              className="px-3 py-1.5 rounded-md text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Temizle
            </button>
          </>
        )}
        
        {missionActive && (
          <>
            <div className="w-px bg-slate-700 mx-1" />
            <button
              onClick={handleAbortMission}
              className="px-3 py-1.5 rounded-md text-xs font-mono text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              İptal
            </button>
          </>
        )}
      </div>
      
      <AnimatePresence>
        {isEditingMode && !missionActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-mono border border-cyan-500/30"
          >
            Haritaya tıklayarak waypoint ekleyin
          </motion.div>
        )}
        
        {missionActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-xs font-mono border border-green-500/30 flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Görev Aktif - {waypoints.length} Waypoint
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
