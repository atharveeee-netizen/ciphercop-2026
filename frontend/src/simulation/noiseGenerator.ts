export function addNoise(value: number, amplitude: number): number {
  return value + (Math.random() - 0.5) * 2 * amplitude;
}

export function smoothNoise(time: number, frequency: number, amplitude: number): number {
  return Math.sin(time * frequency) * amplitude + (Math.random() - 0.5) * amplitude * 0.3;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
