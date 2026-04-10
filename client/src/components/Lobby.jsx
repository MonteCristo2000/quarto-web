import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const TIME_OPTIONS = [
  { label: "3 min",  value: 180 },
  { label: "5 min",  value: 300 },
  { label: "10 min", value: 600 },
];

const MODE_OPTIONS = [
  {
    value: "classic",
    label: "Classic",
    desc: "Give any piece to your opponent.",
  },
  {
    value: "color",
    label: "Color Mode",
    desc: "Player 1 gives cyan pieces · Player 2 gives red pieces.",
  },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy",   label: "Easy",   desc: "Looks 1 move ahead. Good for learning." },
  { value: "medium", label: "Medium", desc: "Looks 3 moves ahead. A decent challenge." },
  { value: "hard",   label: "Hard",   desc: "Looks 5 moves ahead. Hard to beat." },
];

/**
 * Lobby — lets a player create or join a room.
 * Props:  onJoin({ roomCode, playerName }) => void
 */
export default function Lobby({ onJoin }) {
  const [createName,  setCreateName]  = useState("");
  const [joinName,    setJoinName]    = useState("");
  const [joinCode,    setJoinCode]    = useState("");
  const [createError, setCreateError] = useState("");
  const [joinError,   setJoinError]   = useState("");
  const [creating,    setCreating]    = useState(false);

  // Settings — only the creator chooses these
  const [gameMode,      setGameMode]      = useState("classic");
  const [timeLimit,     setTimeLimit]     = useState(300);
  const [opponentType,  setOpponentType]  = useState("human");   // "human" | "ai"
  const [aiDifficulty,  setAiDifficulty]  = useState("medium");

  async function handleCreate(e) {
    e.preventDefault();
    const name = createName.trim();
    if (!name) { setCreateError("Please enter your name."); return; }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_mode:     gameMode,
          time_limit:    timeLimit,
          vs_ai:         opponentType === "ai",
          ai_difficulty: opponentType === "ai" ? aiDifficulty : undefined,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      onJoin({ roomCode: data.room_code, playerName: name });
    } catch {
      setCreateError("Could not reach server. Is it running?");
    } finally {
      setCreating(false);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    const name = joinName.trim();
    const code = joinCode.trim().toUpperCase();
    if (!name) { setJoinError("Please enter your name."); return; }
    if (code.length !== 4) { setJoinError("Room code must be 4 letters."); return; }
    setJoinError("");
    onJoin({ roomCode: code, playerName: name });
  }

  return (
    <div className="lobby">
      <div style={{ textAlign: "center" }}>
        <div className="lobby__title">QUARTO</div>
        <div className="lobby__subtitle">The strategic board game for two players</div>
      </div>

      <div className="lobby__cards">
        {/* ── Create room ── */}
        <div className="lobby__card">
          <h2>Create Room</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
              className="lobby__input"
              type="text"
              placeholder="Your name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              maxLength={20}
              autoComplete="off"
            />

            {/* Game mode */}
            <div>
              <div className="lobby__option-label">Game mode</div>
              <div className="lobby__toggle-group">
                {MODE_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`lobby__toggle${gameMode === m.value ? " lobby__toggle--active" : ""}`}
                    onClick={() => setGameMode(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="lobby__option-desc">
                {MODE_OPTIONS.find((m) => m.value === gameMode)?.desc}
              </div>
            </div>

            {/* Time limit */}
            <div>
              <div className="lobby__option-label">Time per player</div>
              <div className="lobby__toggle-group">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`lobby__toggle${timeLimit === t.value ? " lobby__toggle--active" : ""}`}
                    onClick={() => setTimeLimit(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opponent */}
            <div>
              <div className="lobby__option-label">Opponent</div>
              <div className="lobby__toggle-group">
                <button
                  type="button"
                  className={`lobby__toggle${opponentType === "human" ? " lobby__toggle--active" : ""}`}
                  onClick={() => setOpponentType("human")}
                >
                  vs Human
                </button>
                <button
                  type="button"
                  className={`lobby__toggle${opponentType === "ai" ? " lobby__toggle--active" : ""}`}
                  onClick={() => setOpponentType("ai")}
                >
                  vs AI
                </button>
              </div>

              {opponentType === "ai" && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div className="lobby__toggle-group">
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        className={`lobby__toggle${aiDifficulty === d.value ? " lobby__toggle--active" : ""}`}
                        onClick={() => setAiDifficulty(d.value)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="lobby__option-desc">
                    {DIFFICULTY_OPTIONS.find((d) => d.value === aiDifficulty)?.desc}
                  </div>
                </div>
              )}
            </div>

            {createError && <div className="lobby__error">{createError}</div>}
            <button
              className="lobby__btn lobby__btn--primary"
              type="submit"
              disabled={creating}
            >
              {creating ? "Creating…" : opponentType === "ai" ? "Play vs AI" : "Create Room"}
            </button>
          </form>
        </div>

        {/* ── Join room ── */}
        <div className="lobby__card">
          <h2>Join Room</h2>
          <p style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
            Game settings are chosen by the room creator.
          </p>
          <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              className="lobby__input"
              type="text"
              placeholder="Your name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              maxLength={20}
              autoComplete="off"
            />
            <input
              className="lobby__input lobby__input--code"
              type="text"
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              autoComplete="off"
              spellCheck={false}
            />
            {joinError && <div className="lobby__error">{joinError}</div>}
            <button className="lobby__btn lobby__btn--secondary" type="submit">
              Join Room
            </button>
          </form>
        </div>
      </div>

      <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", textAlign: "center", maxWidth: 460 }}>
        One player creates a room and shares the 4-letter code. The other enters it to join.
      </div>
    </div>
  );
}
