import { memo, useRef, useEffect } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { formatNumber } from '../../utils/formatters';

const SIZE = 240;
const CENTER = SIZE / 2;
const DEG_TO_RAD = Math.PI / 180;
const PIXELS_PER_DEGREE = 4;

function drawHorizon(ctx: CanvasRenderingContext2D, pitch: number, roll: number) {
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.clearRect(0, 0, SIZE * dpr, SIZE * dpr);
  ctx.scale(dpr, dpr);

  // Clip to circle
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, CENTER - 2, 0, Math.PI * 2);
  ctx.clip();

  // Rotate for roll
  ctx.translate(CENTER, CENTER);
  ctx.rotate(-roll * DEG_TO_RAD);

  const pitchOffset = pitch * PIXELS_PER_DEGREE;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, -CENTER - pitchOffset - 80, 0, pitchOffset);
  skyGrad.addColorStop(0, '#1e40af');
  skyGrad.addColorStop(1, '#3b82f6');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-CENTER - 50, -CENTER - 200, SIZE + 100, CENTER + 200 + pitchOffset);

  // Ground gradient
  const gndGrad = ctx.createLinearGradient(0, pitchOffset, 0, CENTER + 200 + pitchOffset);
  gndGrad.addColorStop(0, '#92400e');
  gndGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = gndGrad;
  ctx.fillRect(-CENTER - 50, pitchOffset, SIZE + 100, CENTER + 200);

  // Horizon line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-CENTER - 50, pitchOffset);
  ctx.lineTo(CENTER + 50, pitchOffset);
  ctx.stroke();

  // Pitch ladder
  ctx.fillStyle = '#ffffff';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  for (let deg = -30; deg <= 30; deg += 10) {
    if (deg === 0) continue;
    const y = pitchOffset - deg * PIXELS_PER_DEGREE;
    const halfWidth = deg % 20 === 0 ? 30 : 18;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-halfWidth, y);
    ctx.lineTo(halfWidth, y);
    ctx.stroke();
    ctx.fillText(`${Math.abs(deg)}`, halfWidth + 12, y + 3);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  // Roll indicator arc
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, CENTER - 14, -Math.PI * 5 / 6, -Math.PI / 6);
  ctx.stroke();

  // Roll tick marks
  const rollTicks = [0, 10, 20, 30, 60, -10, -20, -30, -60];
  for (const tick of rollTicks) {
    const angle = (-90 + tick) * DEG_TO_RAD;
    const r1 = CENTER - 14;
    const r2 = CENTER - (Math.abs(tick) % 30 === 0 ? 6 : 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = Math.abs(tick) % 30 === 0 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(CENTER + Math.cos(angle) * r1, CENTER + Math.sin(angle) * r1);
    ctx.lineTo(CENTER + Math.cos(angle) * r2, CENTER + Math.sin(angle) * r2);
    ctx.stroke();
  }

  // Roll triangle pointer
  const rollAngle = (-90 - roll) * DEG_TO_RAD;
  const triR = CENTER - 14;
  const tx = CENTER + Math.cos(rollAngle) * triR;
  const ty = CENTER + Math.sin(rollAngle) * triR;
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - 4, ty + 8);
  ctx.lineTo(tx + 4, ty + 8);
  ctx.closePath();
  ctx.fill();

  // Fixed aircraft reference (yellow wings)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  // Left wing
  ctx.beginPath();
  ctx.moveTo(CENTER - 50, CENTER);
  ctx.lineTo(CENTER - 15, CENTER);
  ctx.stroke();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(CENTER + 15, CENTER);
  ctx.lineTo(CENTER + 50, CENTER);
  ctx.stroke();
  // Center dot
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 3, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, CENTER - 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export const ArtificialHorizon = memo(function ArtificialHorizon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pitch = useTelemetryStore((s) => s.currentData?.attitude.pitch ?? 0);
  const roll = useTelemetryStore((s) => s.currentData?.attitude.roll ?? 0);
  const animRef = useRef<number>(0);
  const valuesRef = useRef({ pitch: 0, roll: 0 });

  useEffect(() => {
    valuesRef.current = { pitch, roll };
  }, [pitch, roll]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;

    function animate() {
      drawHorizon(ctx!, valuesRef.current.pitch, valuesRef.current.roll);
      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">attitude indicator</span>
      <canvas
        ref={canvasRef}
        className="rounded-full"
        style={{ width: SIZE, height: SIZE }}
      />
      <div className="flex gap-4">
        <span className="text-[10px] font-mono text-slate-400">
          PITCH: <span className="text-cyan-400">{pitch > 0 ? '+' : ''}{formatNumber(pitch)}&deg;</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          ROLL: <span className="text-cyan-400">{roll > 0 ? '+' : ''}{formatNumber(roll)}&deg;</span>
        </span>
      </div>
    </div>
  );
});
