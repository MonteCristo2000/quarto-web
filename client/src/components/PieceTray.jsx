import { useState } from "react";
import PieceShape from "./PieceShape.jsx";

/**
 * PieceTray — shows all 16 pieces; available ones are selectable.
 *
 * Props:
 *   available    - array of available piece numbers
 *   canSelect    - bool: whether the local player can select a piece this turn
 *   opponentName - string name of the opponent
 *   playerNum    - 1 | 2 — which player the local user is
 *   gameMode     - "classic" | "color"
 *   onSelect     - (piece) => void — called when confirmed
 */
export default function PieceTray({ available, canSelect, opponentName, playerNum, gameMode, onSelect }) {
  const [pending, setPending] = useState(null);

  const availableSet = new Set(available);

  /**
   * In color mode, the selector may only give pieces of their assigned color:
   *   Player 1 → light pieces (color bit = 0, cyan)
   *   Player 2 → dark  pieces (color bit = 1, red)
   */
  function isColorAllowed(piece) {
    if (gameMode !== "color") return true;
    const colorBit = (piece >> 1) & 1;   // 0 = light, 1 = dark
    const expected = playerNum - 1;       // P1 → 0, P2 → 1
    return colorBit === expected;
  }

  function isClickable(piece) {
    return canSelect && availableSet.has(piece) && isColorAllowed(piece);
  }

  function handleCellClick(piece) {
    if (!isClickable(piece)) return;
    setPending((prev) => (prev === piece ? null : piece));
  }

  function handleConfirm() {
    if (pending === null) return;
    onSelect(pending);
    setPending(null);
  }

  // Color mode hint
  const colorHint = gameMode === "color"
    ? playerNum === 1
      ? "You give cyan pieces"
      : "You give red pieces"
    : null;

  return (
    <div className="piece-tray">
      <div className="piece-tray__header">
        <span className="piece-tray__title">Pieces</span>
        {colorHint && (
          <span
            className="piece-tray__color-hint"
            style={{ color: playerNum === 1 ? "var(--piece-cyan)" : "var(--piece-red)" }}
          >
            {colorHint}
          </span>
        )}
      </div>

      <div className="piece-tray__grid">
        {Array.from({ length: 16 }, (_, i) => {
          const isAvailable   = availableSet.has(i);
          const isPending     = pending === i;
          const colorOk       = isColorAllowed(i);
          const clickable     = isClickable(i);
          // Dim if: used OR (color mode + wrong color)
          const dimmed        = !isAvailable || (gameMode === "color" && canSelect && !colorOk);

          let classNames = "piece-tray__cell";
          if (clickable)   classNames += " piece-tray__cell--available";
          if (isPending)   classNames += " piece-tray__cell--pending";
          if (dimmed)      classNames += " piece-tray__cell--used";

          return (
            <div
              key={i}
              className={classNames}
              onClick={() => handleCellClick(i)}
              title={
                !isAvailable      ? "Already placed"
                : !colorOk && gameMode === "color" ? "Not your color"
                : `Piece ${i}`
              }
              role={clickable ? "button" : "img"}
              aria-label={`Piece ${i}${!isAvailable ? " (used)" : ""}${isPending ? " (selected)" : ""}`}
              aria-pressed={isPending ? "true" : undefined}
            >
              <PieceShape piece={i} />
            </div>
          );
        })}
      </div>

      {canSelect && pending !== null && (
        <button className="piece-tray__confirm" onClick={handleConfirm}>
          Give to {opponentName || "opponent"} &rarr;
        </button>
      )}
    </div>
  );
}
