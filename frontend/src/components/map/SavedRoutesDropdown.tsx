import { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouteStore } from '../../store/routeStore';
import { getSavedRoutes, saveRoute, deleteRoute } from '../../utils/routeStorage';
import type { SavedRoute } from '../../types/telemetry';

export const SavedRoutesDropdown = memo(function SavedRoutesDropdown() {
  const { waypoints, addWaypoint, clearRoute } = useRouteStore();
  const [isOpen, setIsOpen] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [routeName, setRouteName] = useState('');
  
  const hasWaypoints = waypoints.length > 0;

  useEffect(() => {
    if (isOpen) {
      setSavedRoutes(getSavedRoutes());
    }
  }, [isOpen]);

  const handleSave = useCallback(() => {
    if (!routeName.trim() || !hasWaypoints) return;
    
    const saved = saveRoute(routeName.trim(), waypoints);
    if (saved) {
      setSavedRoutes(getSavedRoutes());
      setRouteName('');
      setShowSaveInput(false);
    }
  }, [routeName, waypoints, hasWaypoints]);

  const handleLoad = useCallback((route: SavedRoute) => {
    clearRoute();
    route.waypoints.forEach((wp) => {
      addWaypoint(wp.lat, wp.lng, wp.type);
    });
    setIsOpen(false);
  }, [clearRoute, addWaypoint]);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteRoute(id);
    setSavedRoutes(getSavedRoutes());
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-md text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        Kayıtlı Rotalar
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 mt-1 w-64 bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl overflow-hidden z-50"
          >
            {hasWaypoints && (
              <div className="p-2 border-b border-slate-700/50">
                {!showSaveInput ? (
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="w-full px-3 py-1.5 rounded text-xs font-mono text-green-400 hover:bg-green-500/10 flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Rotaları Kaydet
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="Rota adı..."
                      className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs font-mono text-slate-200"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') setShowSaveInput(false);
                      }}
                    />
                    <button
                      onClick={handleSave}
                      disabled={!routeName.trim()}
                      className="px-2 py-1 rounded text-xs font-mono bg-green-500/20 text-green-400 disabled:opacity-50"
                    >
                      Kaydet
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="max-h-48 overflow-y-auto">
              {savedRoutes.length === 0 ? (
                <div className="px-3 py-4 text-xs font-mono text-slate-500 text-center">
                  Kayıtlı rota yok
                </div>
              ) : (
                savedRoutes.map((route) => (
                  <div
                    key={route.id}
                    onClick={() => handleLoad(route)}
                    className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-mono text-slate-200">{route.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {route.waypoints.length} waypoint • {new Date(route.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(route.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
