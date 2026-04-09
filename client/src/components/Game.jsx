import Board from "./Board.jsx";
import PieceTray from "./PieceTray.jsx";
import ClockBar from "./ClockBar.jsx";
import StatusBar from "./StatusBar.jsx";
import WinOverlay from "./WinOverlay.jsx";
import ScoreBar from "./ScoreBar.jsx";
import Reactions from "./Reactions.jsx";
import { useGame } from "../hooks/useGame.js";
import { useClock } from "../hooks/useClock.js";

/**
 * Game — root in-game screen.
 *
 * Props:
 *   roomCode   - string
 *   playerName - string
 *   onLeave    - () => void
 */
export default function Game({ roomCode, playerName, onLeave }) {
  const {
    joined,
    playerNum,
    waiting,
    gameState,
    names,
    serverClocks,
    settings,
    scores,
    error,
    opponentLeft,
    rematchWaiting,
    rematchRequested,
    incomingReaction,
    selectPiece,
    placePiece,
    requestRematch,
    sendReaction,
  } = useGame(roomCode, playerName);

  const gameMode  = settings?.game_mode  ?? "classic";
  const timeLimit = settings?.time_limit ?? 300;

  // Determine which player's clock is active
  // During "select" phase, the current_player is selecting → their clock ticks.
  // During "place" phase, the current_player is placing → their clock ticks.
  // If game is over, no clock ticks.
  const activeClock =
    gameState && !gameState.game_over ? gameState.current_player : null;

  const clocks = useClock(serverClocks, activeClock, gameState?.game_over ?? true);

  if (!joined) {
    return (
      <div className="lobby" style={{ minHeight: "100vh" }}>
        <div className="lobby__title">QUARTO</div>
        <div style={{ color: "var(--text-secondary)" }}>Connecting to room {roomCode}…</div>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="lobby" style={{ minHeight: "100vh" }}>
        <div className="lobby__title">QUARTO</div>
        <div style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Room <strong style={{ color: "var(--accent-cyan)", letterSpacing: "0.15em" }}>{roomCode}</strong>
        </div>
        <div style={{ color: "var(--text-secondary)" }}>You are Player {playerNum}. Waiting for opponent…</div>
        <div style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
          Share the room code above with your opponent.
        </div>
        <button className="lobby__btn lobby__btn--primary" style={{ marginTop: "0.5rem" }} onClick={onLeave}>
          ← Leave
        </button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="lobby" style={{ minHeight: "100vh" }}>
        <div style={{ color: "var(--text-secondary)" }}>Loading game…</div>
      </div>
    );
  }

  const { board, phase, current_player, current_piece, available, game_over, winner, winning_line } = gameState;

  const isMyTurn   = current_player === playerNum;
  const canPlace   = !game_over && phase === "place"  && isMyTurn;
  const canSelect  = !game_over && phase === "select" && isMyTurn;

  const oppNum     = playerNum === 1 ? 2 : 1;
  const oppName    = names?.[String(oppNum)] || `Player ${oppNum}`;

  const winningCells = winning_line ?? [];

  return (
    <div className="game">
      {/* Header */}
      <header className="game__header">
        <span className="game__logo">QUARTO</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Room: <strong style={{ color: "var(--accent-cyan)", letterSpacing: "0.12em" }}>{roomCode}</strong>
          </span>
          {gameMode === "color" && (
            <span className="game__mode-badge game__mode-badge--color">Color Mode</span>
          )}
          <span className="game__mode-badge">
            {Math.floor(timeLimit / 60)} min
          </span>
        </div>
        <button className="game__leave-btn" onClick={onLeave}>
          ← Leave
        </button>
      </header>

      {/* Body */}
      <div className="game__body">
        {/* Board area */}
        <div className="game__board-area">
          <Board
            board={board}
            currentPiece={current_piece}
            winningCells={winningCells}
            canPlace={canPlace}
            onPlace={placePiece}
          />
        </div>

        {/* Side panel */}
        <aside className="game__side">
          {opponentLeft && (
            <div className="game__disconnect-banner">
              Your opponent disconnected. Waiting for them to reconnect…
            </div>
          )}

          {error && (
            <div className="game__disconnect-banner" style={{ borderColor: "var(--accent-yellow)", color: "var(--accent-yellow)", background: "#2a2500" }}>
              {error}
            </div>
          )}

          <ClockBar
            clocks={clocks}
            activePlayer={activeClock}
            names={names}
            gameOver={game_over}
          />

          <StatusBar
            game={gameState}
            playerNum={playerNum}
            names={names}
            isMyTurn={isMyTurn}
          />

          <PieceTray
            available={available}
            canSelect={canSelect}
            opponentName={oppName}
            playerNum={playerNum}
            gameMode={gameMode}
            onSelect={selectPiece}
          />

          <ScoreBar scores={scores} names={names} />

          <Reactions
            onReact={sendReaction}
            incomingReaction={incomingReaction}
            names={names}
          />
        </aside>
      </div>

      {/* Win overlay */}
      {game_over && (
        <WinOverlay
          game={gameState}
          playerNum={playerNum}
          names={names}
          rematchWaiting={rematchWaiting}
          rematchRequested={rematchRequested}
          onRematch={requestRematch}
          onLeave={onLeave}
        />
      )}
    </div>
  );
}
