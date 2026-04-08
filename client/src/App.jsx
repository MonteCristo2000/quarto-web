import { useState } from "react";
import Lobby from "./components/Lobby.jsx";
import Game from "./components/Game.jsx";

export default function App() {
  const [session, setSession] = useState(null);  // { roomCode, playerName }

  function handleJoin({ roomCode, playerName }) {
    setSession({ roomCode, playerName });
  }

  function handleLeave() {
    setSession(null);
  }

  if (session) {
    return (
      <Game
        roomCode={session.roomCode}
        playerName={session.playerName}
        onLeave={handleLeave}
      />
    );
  }

  return <Lobby onJoin={handleJoin} />;
}
