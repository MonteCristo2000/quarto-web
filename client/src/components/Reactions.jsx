/**
 * Reactions — emoji reaction buttons + floating incoming reaction display.
 *
 * Props:
 *   onReact          - (emoji) => void
 *   incomingReaction - { from, emoji } | null
 *   names            - { "1": name, "2": name }
 */

const EMOJIS = ["👏", "😱", "🤔", "😂", "🔥"];

export default function Reactions({ onReact, incomingReaction, names }) {
  const senderName = incomingReaction
    ? (names?.[String(incomingReaction.from)] || `Player ${incomingReaction.from}`)
    : null;

  return (
    <div className="reactions">
      <div className="reactions__title">React</div>
      <div className="reactions__btns">
        {EMOJIS.map((e) => (
          <button
            key={e}
            className="reactions__btn"
            onClick={() => onReact(e)}
            aria-label={`Send ${e}`}
          >
            {e}
          </button>
        ))}
      </div>

      {incomingReaction && (
        <div className="reactions__incoming" key={incomingReaction.emoji + Date.now()}>
          <span className="reactions__incoming-emoji">{incomingReaction.emoji}</span>
          <span className="reactions__incoming-name">{senderName}</span>
        </div>
      )}
    </div>
  );
}
