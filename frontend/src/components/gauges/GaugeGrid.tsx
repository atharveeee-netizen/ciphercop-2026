import { memo } from 'react';
import { AltitudeGauge } from './AltitudeGauge';
import { SpeedGauge } from './SpeedGauge';
import { HeadingGauge } from './HeadingGauge';
import { BatteryGauge } from './BatteryGauge';

export const GaugeGrid = memo(function GaugeGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <AltitudeGauge />
      <SpeedGauge />
      <HeadingGauge />
      <BatteryGauge />
    </div>
  );
});
