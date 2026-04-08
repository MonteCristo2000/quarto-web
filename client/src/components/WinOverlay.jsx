/**
 * WinOverlay — modal displayed when the game ends.
 *
 * Props:
 *   game       - raw game dict
 *   playerNum  - local player number
 *   names      - { "1": name, "2": name }
 *   onLeave    - () => void — return to lobby
 */
export default function WinOverlay({ game, playerNum, names, onLeave }) {
  if (!game?.game_over) return null;

  const { winner, winning_type } = game;

  const winnerName  = winner ? (names?.[String(winner)] || `Player ${winner}`) : null;
  const isWin       = winner === playerNum;
  const isDraw      = winner === null || winner === undefined;
  const isLose      = !isDraw && !isWin;
  const isTimeout   = winning_type === "timeout";

  let icon, title, titleClass, subtitle;

  if (isDraw) {
    icon        = "🤝";
    title       = "Draw!";
    titleClass  = "win-overlay__title--draw";
    subtitle    = "No more pieces remain — the game is a draw.";
  } else if (isWin) {
    icon        = "🏆";
    title       = "You Win!";
    titleClass  = "win-overlay__title--win";
    subtitle    = isTimeout
      ? "Your opponent ran out of time."
      : `You completed ${winning_type}.`;
  } else {
    icon        = "😔";
    title       = `${winnerName} Wins`;
    titleClass  = "win-overlay__title--lose";
    subtitle    = isTimeout
      ? "You ran out of time."
      : `${winnerName} completed ${winning_type}.`;
  }

  return (
    <div className="win-overlay" role="dialog" aria-modal="true" aria-label="Game over">
      <div className="win-overlay__modal">
        <div className="win-overlay__icon">{icon}</div>
        <div className={`win-overlay__title ${titleClass}`}>{title}</div>
        <div className="win-overlay__subtitle">{subtitle}</div>
        {winning_type && !isDraw && (
          <div className="win-overlay__detail">
            Winning condition: {winning_type}
          </div>
        )}
        <button className="win-overlay__btn" onClick={onLeave}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
