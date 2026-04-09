/**
 * ScoreBar — shows running win tally across rematches.
 *
 * Props:
 *   scores  - { "1": n, "2": n, draws: n }
 *   names   - { "1": name, "2": name }
 */
export default function ScoreBar({ scores, names }) {
  const s1     = scores?.["1"]    ?? 0;
  const s2     = scores?.["2"]    ?? 0;
  const draws  = scores?.draws    ?? 0;
  const name1  = names?.["1"]     || "Player 1";
  const name2  = names?.["2"]     || "Player 2";
  const played = s1 + s2 + draws;
  if (played === 0) return null;   // hide until at least one game finished

  return (
    <div className="score-bar">
      <span className="score-bar__player score-bar__player--1">
        <span className="score-bar__name">{name1}</span>
        <span className="score-bar__num">{s1}</span>
      </span>
      <span className="score-bar__divider">
        {draws > 0 && <span className="score-bar__draws">{draws} draw{draws !== 1 ? "s" : ""}</span>}
        <span className="score-bar__dash">—</span>
      </span>
      <span className="score-bar__player score-bar__player--2">
        <span className="score-bar__num">{s2}</span>
        <span className="score-bar__name">{name2}</span>
      </span>
    </div>
  );
}
