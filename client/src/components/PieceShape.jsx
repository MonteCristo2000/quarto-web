/**
 * PieceShape — renders an SVG representation of a Quarto piece.
 *
 * Bit encoding (same as Python game_logic):
 *   bit 0 (1): size    — 0=short (small), 1=tall (large)
 *   bit 1 (2): color   — 0=cyan,  1=red
 *   bit 2 (4): shape   — 0=circle, 1=square
 *   bit 3 (8): fill    — 0=filled, 1=hollow
 */

const CYAN = "#00d2ff";
const RED  = "#ff3759";

// Internal viewBox coordinate size — CSS scales the SVG to fit its container.
const VB = 100;

export default function PieceShape({ piece }) {
  if (piece === null || piece === undefined) return null;

  const isSmall   = (piece & 1) === 0;     // bit 0: 0=short(small), 1=tall(large)
  const isRed     = (piece & 2) === 2;     // bit 1
  const isSquare  = (piece & 4) === 4;     // bit 2
  const isHollow  = (piece & 8) === 8;     // bit 3

  const fill      = isRed ? RED : CYAN;
  const stroke    = fill;
  const dimension = VB;
  const center    = dimension / 2;

  // Large = 70% of cell, small = 42%
  const radius = center * (isSmall ? 0.42 : 0.70);
  const strokeW = dimension * 0.12;

  let shapeEl;

  if (isSquare) {
    const half = radius;
    const x = center - half;
    const y = center - half;
    const rrPx = dimension * 0.20 * (isSmall ? 0.55 : 1);

    if (isHollow) {
      shapeEl = (
        <rect
          x={x}
          y={y}
          width={half * 2}
          height={half * 2}
          rx={rrPx}
          ry={rrPx}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeW}
        />
      );
    } else {
      shapeEl = (
        <rect
          x={x}
          y={y}
          width={half * 2}
          height={half * 2}
          rx={rrPx}
          ry={rrPx}
          fill={fill}
        />
      );
    }
  } else {
    // Circle
    if (isHollow) {
      shapeEl = (
        <circle
          cx={center}
          cy={center}
          r={radius - strokeW / 2}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeW}
        />
      );
    } else {
      shapeEl = (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill={fill}
        />
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      className="piece-shape"
      aria-label={pieceLabel(piece)}
    >
      {shapeEl}
    </svg>
  );
}

function pieceLabel(piece) {
  const attrs = [
    (piece & 1) ? "tall" : "short",
    (piece & 2) ? "dark" : "light",
    (piece & 4) ? "square" : "round",
    (piece & 8) ? "hollow" : "solid",
  ];
  return attrs.join(", ");
}
