/**
 * WinOverlay — modal displayed when the game ends.
 *
 * Props:
 *   game       - raw game dict
 *   playerNum  - local player number
 *   names      - { "1": name, "2": name }
 *   onLeave    - () => void — return to lobby
 */
const ATTR_LABELS = [
  ["short",  "tall"],
  ["light",  "dark"],
  ["round",  "square"],
  ["solid",  "hollow"],
];

function getCommonAttrs(board, winningLine) {
  if (!winningLine?.length) return [];
  const pieces = winningLine.map(([r, c]) => board[r][c]).filter((p) => p !== null && p !== undefined);
  if (pieces.length < 4) return [];
  return ATTR_LABELS
    .map(([a, b], i) => {
      const bit = (pieces[0] >> i) & 1;
      return pieces.every((p) => ((p >> i) & 1) === bit) ? (bit ? b : a) : null;
    })
    .filter(Boolean);
}

export default function WinOverlay({ game, playerNum, names, rematchWaiting, rematchRequested, onRematch, onLeave }) {
  if (!game?.game_over) return null;

  const { winner, winning_type, board, winning_line } = game;

  const winnerName  = winner ? (names?.[String(winner)] || `Player ${winner}`) : null;
  const isWin       = winner === playerNum;
  const isDraw      = winner === null || winner === undefined;
  const isLose      = !isDraw && !isWin;
  const isTimeout   = winning_type === "timeout";
  const commonAttrs = (!isDraw && !isTimeout) ? getCommonAttrs(board, winning_line) : [];

  // Build a human-readable winning condition string e.g. "4 dark + tall pieces in Column 3"
  function winConditionText() {
    if (isDraw || isTimeout || !winning_type) return null;
    const location = winning_type.startsWith("2×2") ? "a 2×2 square" : winning_type;
    if (commonAttrs.length === 0) return `in ${location}`;
    const attrStr = commonAttrs.join(" + ");
    return `4 ${attrStr} pieces in ${location}`;
  }
  const conditionText = winConditionText();

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
    subtitle    = isTimeout ? "Your opponent ran out of time." : conditionText;
  } else {
    icon        = "😔";
    title       = `${winnerName} Wins`;
    titleClass  = "win-overlay__title--lose";
    subtitle    = isTimeout ? "You ran out of time." : conditionText;
  }

  return (
    <div className="win-overlay" role="dialog" aria-modal="true" aria-label="Game over">
      <div className="win-overlay__modal">
        <div className="win-overlay__icon">{icon}</div>
        <div className={`win-overlay__title ${titleClass}`}>{title}</div>
        <div className="win-overlay__subtitle">{subtitle}</div>
        {commonAttrs.length > 0 && (
          <div className="win-overlay__attrs">
            {commonAttrs.map((attr) => (
              <span key={attr} className="win-overlay__attr-badge">{attr}</span>
            ))}
          </div>
        )}
        <div className="win-overlay__actions">
          {rematchWaiting ? (
            <div className="win-overlay__rematch-waiting">
              Waiting for opponent to accept…
            </div>
          ) : rematchRequested ? (
            <button className="win-overlay__btn win-overlay__btn--rematch" onClick={onRematch}>
              Accept Rematch ⚔️
            </button>
          ) : (
            <button className="win-overlay__btn win-overlay__btn--rematch" onClick={onRematch}>
              Rematch ⚔️
            </button>
          )}
          <button className="win-overlay__btn win-overlay__btn--leave" onClick={onLeave}>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
