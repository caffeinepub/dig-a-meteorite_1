import { useEffect, useState } from "react";

/**
 * Simulates a live player count by starting at a random number
 * between 120–180 and slowly fluctuating ±1 to ±5 every 10–20 seconds.
 */
export function usePlayerCount(): number {
  const [count, setCount] = useState<number>(
    () => Math.floor(Math.random() * 61) + 120,
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const fluctuate = () => {
      const delta = Math.floor(Math.random() * 5) + 1; // 1–5
      const direction = Math.random() < 0.5 ? 1 : -1;
      const delay = Math.floor(Math.random() * 10_000) + 10_000; // 10–20 s

      setCount((prev) => {
        const next = prev + direction * delta;
        // Keep within a plausible range
        return Math.min(250, Math.max(80, next));
      });

      timeoutId = setTimeout(fluctuate, delay);
    };

    const initialDelay = Math.floor(Math.random() * 10_000) + 10_000;
    timeoutId = setTimeout(fluctuate, initialDelay);

    return () => clearTimeout(timeoutId);
  }, []);

  return count;
}
