import { useEffect, useRef } from 'react';
import { TelemetryEngine } from '../simulation/telemetryEngine';
import { useTelemetryStore } from '../store/telemetryStore';

let globalEngine: TelemetryEngine | null = null;

export function getTelemetryEngine(): TelemetryEngine | null {
  return globalEngine;
}

export function useTelemetry() {
  const engineRef = useRef<TelemetryEngine | null>(null);
  const updateTelemetry = useTelemetryStore((s) => s.updateTelemetry);
  const setSimulationRunning = useTelemetryStore((s) => s.setSimulationRunning);
  const isRunning = useTelemetryStore((s) => s.isSimulationRunning);

  useEffect(() => {
    const engine = new TelemetryEngine((data) => {
      updateTelemetry(data);
    });
    engineRef.current = engine;
    globalEngine = engine;
    engine.start();
    setSimulationRunning(true);

    return () => {
      engine.stop();
      setSimulationRunning(false);
      globalEngine = null;
    };
  }, [updateTelemetry, setSimulationRunning]);

  return { isRunning };
}
