import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/**
 * Lobby — lets a player create or join a room.
 *
 * Props:
 *   onJoin - ({ roomCode, playerName }) => void
 */
export default function Lobby({ onJoin }) {
  const [createName, setCreateName] = useState("");
  const [joinName,   setJoinName]   = useState("");
  const [joinCode,   setJoinCode]   = useState("");
  const [createError, setCreateError] = useState("");
  const [joinError,   setJoinError]   = useState("");
  const [creating,    setCreating]    = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    const name = createName.trim();
    if (!name) { setCreateError("Please enter your name."); return; }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch(`${API_BASE}/rooms`, { method: "POST" });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      onJoin({ roomCode: data.room_code, playerName: name });
    } catch (err) {
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
      <div>
        <div className="lobby__title">QUARTO</div>
        <div className="lobby__subtitle">The strategic board game for two players</div>
      </div>

      <div className="lobby__cards">
        {/* Create room */}
        <div className="lobby__card">
          <h2>Create Room</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              className="lobby__input"
              type="text"
              placeholder="Your name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              maxLength={20}
              autoComplete="off"
            />
            {createError && <div className="lobby__error">{createError}</div>}
            <button
              className="lobby__btn lobby__btn--primary"
              type="submit"
              disabled={creating}
            >
              {creating ? "Creating…" : "Create New Room"}
            </button>
          </form>
        </div>

        {/* Join room */}
        <div className="lobby__card">
          <h2>Join Room</h2>
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
            <button
              className="lobby__btn lobby__btn--secondary"
              type="submit"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>

      <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", textAlign: "center", maxWidth: 460 }}>
        Open two browser tabs. One player creates a room and shares the 4-letter code. The second player enters it to join.
      </div>
    </div>
  );
}
