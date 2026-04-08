import PieceShape from "./PieceShape.jsx";

/**
 * StatusBar — shows whose turn it is, the current phase, and the
 * piece currently being placed (if any).
 *
 * Props:
 *   game         - raw game dict from server
 *   playerNum    - local player number (1 or 2)
 *   names        - { "1": name, "2": name }
 *   isMyTurn     - bool
 */
export default function StatusBar({ game, playerNum, names, isMyTurn }) {
  if (!game) return null;

  const { phase, current_player, current_piece, game_over, winner, winning_type } = game;

  const myName  = names[String(playerNum)]   || `Player ${playerNum}`;
  const oppNum  = playerNum === 1 ? 2 : 1;
  const oppName = names[String(oppNum)]      || `Player ${oppNum}`;
  const currentName = names[String(current_player)] || `Player ${current_player}`;

  let phaseLabel = "";
  let message    = "";
  let isYourTurn = false;

  if (game_over) {
    phaseLabel = "Game over";
    if (winner === null) {
      message = "It's a draw!";
    } else if (winner === playerNum) {
      message = "You won! \uD83C\uDF89";
      isYourTurn = true; // green colour
    } else {
      message = `${names[String(winner)] || `Player ${winner}`} wins!`;
    }
  } else if (phase === "select") {
    phaseLabel = "Select phase";
    if (isMyTurn) {
      message = `Your turn — choose a piece to give to ${oppName}`;
      isYourTurn = true;
    } else {
      message = `${currentName} is choosing a piece…`;
    }
  } else {
    phaseLabel = "Place phase";
    if (isMyTurn) {
      message = "Your turn — place the piece on the board";
      isYourTurn = true;
    } else {
      message = `${currentName} is placing a piece…`;
    }
  }

  return (
    <div className="status-bar">
      <div className="status-bar__phase">{phaseLabel}</div>
      <div className={`status-bar__message ${isYourTurn ? "status-bar__message--your-turn" : "status-bar__message--wait"}`}>
        {message}
      </div>

      {current_piece !== null && current_piece !== undefined && (
        <div className="status-bar__current-piece">
          <span className="status-bar__piece-label">Piece to place:</span>
          <div className="status-bar__piece-box">
            <PieceShape piece={current_piece} />
          </div>
        </div>
      )}
    </div>
  );
}
