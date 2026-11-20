import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import type { AlertSeverity } from '../types/telemetry';

interface AlertRule {
  id: string;
  check: (data: { battery: number; altitude: number; rssi: number; windSpeed: number }) => boolean;
  severity: AlertSeverity;
  message: string;
  cooldown: number;
}

const RULES: AlertRule[] = [
  { id: 'low_battery', check: (d) => d.battery < 20, severity: 'CRITICAL', message: 'LOW BATTERY — Level below 20%', cooldown: 15000 },
  { id: 'alt_limit', check: (d) => d.altitude > 180, severity: 'WARNING', message: 'ALTITUDE LIMIT — Approaching max ceiling', cooldown: 10000 },
  { id: 'signal_weak', check: (d) => d.rssi < -80, severity: 'WARNING', message: 'SIGNAL WEAK — RSSI below -80 dBm', cooldown: 10000 },
  { id: 'high_wind', check: (d) => d.windSpeed > 12, severity: 'WARNING', message: 'HIGH WIND — Wind speed exceeding 12 m/s', cooldown: 8000 },
];

export function useAlerts() {
  const currentData = useTelemetryStore((s) => s.currentData);
  const addAlert = useTelemetryStore((s) => s.addAlert);
  const alerts = useTelemetryStore((s) => s.alerts);
  const dismissAlert = useTelemetryStore((s) => s.dismissAlert);
  const lastFired = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!currentData) return;

    const now = Date.now();
    const values = {
      battery: currentData.battery.percentage,
      altitude: currentData.position.altitude,
      rssi: currentData.sensors.rssi,
      windSpeed: currentData.sensors.windSpeed,
    };

    for (const rule of RULES) {
      if (rule.check(values)) {
        const last = lastFired.current[rule.id] ?? 0;
        if (now - last > rule.cooldown) {
          lastFired.current[rule.id] = now;
          addAlert({
            id: `${rule.id}_${now}`,
            timestamp: now,
            severity: rule.severity,
            message: rule.message,
          });
        }
      }
    }
  }, [currentData, addAlert]);

  return { alerts, dismissAlert };
}
