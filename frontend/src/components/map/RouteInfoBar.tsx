import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouteStore } from '../../store/routeStore';
import { formatDuration, formatDistance } from '../../utils/formatters';

export const RouteInfoBar = memo(function RouteInfoBar() {
  const { waypoints, totalDistance, estimatedDuration, isEditingMode } = useRouteStore();
  
  const hasWaypoints = waypoints.length > 0;
  
  const stats = useMemo(() => ({
    distance: formatDistance(totalDistance),
    duration: formatDuration(estimatedDuration),
    count: waypoints.length,
  }), [totalDistance, estimatedDuration, waypoints.length]);

  return (
    <AnimatePresence>
      {hasWaypoints && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-3 left-3 right-3 z-[1000]"
        >
          <div className="flex justify-center">
            <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50 px-4 py-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">Mesafe</span>
                  <span className="text-sm font-mono text-slate-200">{stats.distance}</span>
                </div>
              </div>
              
              <div className="w-px h-8 bg-slate-700" />
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">ETA</span>
                  <span className="text-sm font-mono text-slate-200">{stats.duration}</span>
                </div>
              </div>
              
              <div className="w-px h-8 bg-slate-700" />
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">Waypoint</span>
                  <span className="text-sm font-mono text-slate-200">{stats.count}</span>
                </div>
              </div>
              
              {isEditingMode && (
                <>
                  <div className="w-px h-8 bg-slate-700" />
                  <span className="text-[10px] text-cyan-400 animate-pulse">Düzenleme Modu</span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
