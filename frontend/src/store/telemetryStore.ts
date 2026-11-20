import { create } from 'zustand';
import type { TelemetryData, Alert, HistoryPoint } from '../types/telemetry';
import { MAX_FLIGHT_PATH_POINTS, MAX_HISTORY_POINTS, MAX_ALERTS } from '../utils/constants';

interface TelemetryStore {
  currentData: TelemetryData | null;
  altitudeHistory: HistoryPoint[];
  speedHistory: HistoryPoint[];
  flightPath: [number, number][];
  alerts: Alert[];
  isSimulationRunning: boolean;

  updateTelemetry: (data: TelemetryData) => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  setSimulationRunning: (running: boolean) => void;
}

export const useTelemetryStore = create<TelemetryStore>((set) => ({
  currentData: null,
  altitudeHistory: [],
  speedHistory: [],
  flightPath: [],
  alerts: [],
  isSimulationRunning: false,

  updateTelemetry: (data) =>
    set((state) => {
      const now = data.timestamp;
      const newAltHistory = [...state.altitudeHistory, { time: now, value: data.position.altitude }];
      const newSpeedHistory = [...state.speedHistory, { time: now, value: data.velocity.groundSpeed }];
      const newPath: [number, number][] = [...state.flightPath, [data.position.latitude, data.position.longitude]];

      return {
        currentData: data,
        altitudeHistory: newAltHistory.slice(-MAX_HISTORY_POINTS),
        speedHistory: newSpeedHistory.slice(-MAX_HISTORY_POINTS),
        flightPath: newPath.slice(-MAX_FLIGHT_PATH_POINTS),
      };
    }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS),
    })),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),

  setSimulationRunning: (running) =>
    set({ isSimulationRunning: running }),
}));
