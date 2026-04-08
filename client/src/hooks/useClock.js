import { useState, useEffect, useRef } from "react";

/**
 * useClock — client-side interpolation of server clock values.
 *
 * @param {object} serverClocks  - { 1: seconds, 2: seconds } from last server state
 * @param {number|null} activeClock - which player's clock is ticking (1 or 2)
 * @param {boolean} gameOver
 * @returns {{ 1: number, 2: number }} interpolated remaining seconds
 */
export function useClock(serverClocks, activeClock, gameOver) {
  const [clocks, setClocks] = useState({ 1: 300, 2: 300 });
  const serverRef = useRef(serverClocks);
  const activeRef = useRef(activeClock);
  const snapshotTimeRef = useRef(Date.now());

  // When server sends new values, reset snapshot
  useEffect(() => {
    serverRef.current = serverClocks;
    activeRef.current = activeClock;
    snapshotTimeRef.current = Date.now();
    setClocks({ ...serverClocks });
  }, [serverClocks, activeClock]);

  useEffect(() => {
    if (gameOver) return;

    const id = setInterval(() => {
      const active = activeRef.current;
      if (active === null || active === undefined) return;

      const elapsed = (Date.now() - snapshotTimeRef.current) / 1000;
      const base = serverRef.current[active] ?? 0;
      const remaining = Math.max(0, base - elapsed);

      setClocks((prev) => ({
        ...prev,
        [active]: remaining,
      }));
    }, 250);

    return () => clearInterval(id);
  }, [gameOver]);

  return clocks;
}
