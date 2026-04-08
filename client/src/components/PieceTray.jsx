import { useState } from "react";
import PieceShape from "./PieceShape.jsx";

/**
 * PieceTray — shows all 16 pieces; available ones are selectable.
 *
 * Props:
 *   available     - array of available piece numbers
 *   canSelect     - bool: whether the local player can select a piece
 *   opponentName  - string name of the opponent
 *   onSelect      - (piece) => void — called when confirmed
 */
export default function PieceTray({ available, canSelect, opponentName, onSelect }) {
  const [pending, setPending] = useState(null);

  const availableSet = new Set(available);

  function handleCellClick(piece) {
    if (!canSelect) return;
    if (!availableSet.has(piece)) return;
    setPending((prev) => (prev === piece ? null : piece));
  }

  function handleConfirm() {
    if (pending === null) return;
    onSelect(pending);
    setPending(null);
  }

  return (
    <div className="piece-tray">
      <div className="piece-tray__title">Pieces</div>
      <div className="piece-tray__grid">
        {Array.from({ length: 16 }, (_, i) => {
          const isAvailable = availableSet.has(i);
          const isPending   = pending === i;
          const isUsed      = !isAvailable && pending !== i;

          let classNames = "piece-tray__cell";
          if (isAvailable && canSelect) classNames += " piece-tray__cell--available";
          if (isPending)               classNames += " piece-tray__cell--pending";
          if (isUsed)                  classNames += " piece-tray__cell--used";

          return (
            <div
              key={i}
              className={classNames}
              onClick={() => handleCellClick(i)}
              title={isAvailable ? `Piece ${i}` : "Used"}
              role={isAvailable && canSelect ? "button" : "img"}
              aria-label={`Piece ${i}${!isAvailable ? " (used)" : ""}${isPending ? " (selected)" : ""}`}
              aria-pressed={isPending ? "true" : undefined}
            >
              <PieceShape piece={i} />
            </div>
          );
        })}
      </div>

      {canSelect && pending !== null && (
        <button
          className="piece-tray__confirm"
          onClick={handleConfirm}
        >
          Give to {opponentName || "opponent"} &rarr;
        </button>
      )}
    </div>
  );
}
