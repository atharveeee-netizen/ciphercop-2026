import { useEffect, useRef, useState } from 'react';
import { formatTime } from '../utils/formatters';

export function useFlightTimer(isRunning: boolean) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  return { formattedTime: formatTime(seconds), seconds };
}
