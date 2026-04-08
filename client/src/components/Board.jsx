import { useState } from "react";
import PieceShape from "./PieceShape.jsx";

/**
 * Board — 4x4 grid.
 *
 * Props:
 *   board          - 4x4 array of piece numbers or null
 *   currentPiece   - piece number being placed (null during select phase)
 *   winningCells   - array of [row, col] pairs (or [])
 *   canPlace       - bool: whether the local player can place right now
 *   onPlace        - (row, col) => void
 */
export default function Board({ board, currentPiece, winningCells = [], canPlace, onPlace }) {
  const [hoverCell, setHoverCell] = useState(null);

  const winSet = new Set(winningCells.map(([r, c]) => `${r},${c}`));

  function cellSize(el) {
    if (!el) return 48;
    return el.offsetWidth;
  }

  return (
    <div className="board" role="grid" aria-label="Quarto board">
      {board.map((row, r) =>
        row.map((piece, c) => {
          const isWinning  = winSet.has(`${r},${c}`);
          const isEmpty    = piece === null;
          const isHovered  = hoverCell?.[0] === r && hoverCell?.[1] === c;
          const isEven     = (r + c) % 2 === 0;
          const isClickable = canPlace && isEmpty;

          let classNames = "board__cell";
          if (isEven)     classNames += " board__cell--even";
          if (isClickable) classNames += " board__cell--clickable";
          if (isWinning)  classNames += " board__cell--winning";

          return (
            <div
              key={`${r},${c}`}
              className={classNames}
              role="gridcell"
              aria-label={`Row ${r + 1}, Column ${c + 1}${piece !== null ? `, occupied` : ``}`}
              onClick={() => {
                if (isClickable) onPlace(r, c);
              }}
              onMouseEnter={() => {
                if (isClickable) setHoverCell([r, c]);
              }}
              onMouseLeave={() => setHoverCell(null)}
            >
              {piece !== null && (
                <PieceShape piece={piece} />
              )}
              {/* Ghost preview on hover */}
              {isEmpty && isHovered && currentPiece !== null && (
                <div className="board__ghost">
                  <PieceShape piece={currentPiece} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
