/**
 * ClockBar — two countdown clocks, one per player.
 *
 * Props:
 *   clocks       - { 1: seconds, 2: seconds }
 *   activePlayer - which player's clock is running (1 | 2 | null)
 *   names        - { "1": name, "2": name }
 *   gameOver     - bool
 */
export default function ClockBar({ clocks, activePlayer, names, gameOver }) {
  function format(secs) {
    if (secs <= 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="clock-bar">
      {[1, 2].map((p) => {
        const secs      = clocks[p] ?? 300;
        const isActive  = activePlayer === p && !gameOver;
        const isLow     = secs < 60;
        const isTimeout = secs <= 0;

        let playerClass = "clock-bar__player";
        if (isActive)  playerClass += " clock-bar__player--active";
        if (isLow)     playerClass += " clock-bar__player--low";

        let timeClass = "clock-bar__time";
        if (isLow)     timeClass += " clock-bar__time--low";
        if (isTimeout) timeClass += " clock-bar__time--timeout";

        return (
          <div key={p} className={playerClass}>
            <div className="clock-bar__name">
              {names?.[String(p)] || `Player ${p}`}
            </div>
            <div className={timeClass}>
              {isTimeout ? "TIMEOUT" : format(secs)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
