import { memo } from 'react';
import { TelemetryMap } from '../map/TelemetryMap';
import { GaugeGrid } from '../gauges/GaugeGrid';
import { ArtificialHorizon } from '../horizon/ArtificialHorizon';
import { TelemetryCharts } from '../charts/TelemetryCharts';
import { SensorPanel } from '../sensors/SensorPanel';
import { AlertPanel } from '../alerts/AlertPanel';

export const DashboardGrid = memo(function DashboardGrid() {
  return (
    <div className="flex-1 p-2 overflow-auto min-h-0">
      {/* Desktop Layout: 1440px+ */}
      <div className="h-full grid grid-rows-[1fr_auto] gap-2 max-xl:hidden">
        {/* Top row */}
        <div className="grid grid-cols-[3fr_2fr] gap-2 min-h-0">
          {/* Map */}
          <div className="min-h-0">
            <TelemetryMap />
          </div>
          {/* Right column */}
          <div className="flex flex-col gap-2 min-h-0">
            <GaugeGrid />
            <div className="flex-1 flex items-center justify-center min-h-0">
              <ArtificialHorizon />
            </div>
          </div>
        </div>
        {/* Bottom row */}
        <div className="grid grid-cols-[3fr_2fr] gap-2">
          <TelemetryCharts />
          <div className="flex flex-col gap-2">
            <SensorPanel />
            <AlertPanel />
          </div>
        </div>
      </div>

      {/* Tablet/Medium Layout: 768px - 1439px */}
      <div className="hidden md:flex max-md:hidden xl:hidden flex-col gap-2">
        <div className="h-[350px]">
          <TelemetryMap />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <GaugeGrid />
            <TelemetryCharts />
          </div>
          <div className="flex flex-col gap-2 items-center">
            <ArtificialHorizon />
            <SensorPanel />
            <AlertPanel />
          </div>
        </div>
      </div>

      {/* Mobile Layout: < 768px */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="h-[250px]">
          <TelemetryMap />
        </div>
        <GaugeGrid />
        <div className="flex justify-center">
          <ArtificialHorizon />
        </div>
        <TelemetryCharts />
        <SensorPanel />
        <AlertPanel />
      </div>
    </div>
  );
});
