import { memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useTelemetryStore } from '../../store/telemetryStore';
import { MAX_ALTITUDE } from '../../utils/constants';

export const AltitudeChart = memo(function AltitudeChart() {
  const history = useTelemetryStore((s) => s.altitudeHistory);

  const data = history.map((p, i) => ({
    idx: i,
    time: new Date(p.time).toLocaleTimeString('en-GB', { minute: '2-digit', second: '2-digit' }),
    value: parseFloat(p.value.toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
          interval={Math.floor(data.length / 6)}
          axisLine={{ stroke: '#1e293b' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, MAX_ALTITUDE]}
          tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#1e293b' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f172a',
            border: '1px solid #00e5ff33',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: 'monospace',
          }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#00e5ff' }}
        />
        <ReferenceLine y={MAX_ALTITUDE * 0.9} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#00e5ff"
          fill="url(#altGrad)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          name="ALT"
          unit="m"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
