import { useState, useEffect, useCallback, useRef } from "react";
import { connect, send, onMessage, disconnect } from "../ws.js";

/**
 * useGame — manages WebSocket connection and game state.
 *
 * @param {string} roomCode  - 4-letter room code
 * @param {string} playerName
 * @returns {object} game state + action dispatchers
 */
export function useGame(roomCode, playerName) {
  const [joined, setJoined] = useState(false);
  const [playerNum, setPlayerNum] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [names, setNames] = useState({});
  const [serverClocks, setServerClocks] = useState({ 1: 300, 2: 300 });
  const [settings, setSettings] = useState({ game_mode: "classic", time_limit: 300 });
  const [error, setError] = useState(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [rematchWaiting, setRematchWaiting] = useState(false);   // I clicked, waiting for opponent
  const [rematchRequested, setRematchRequested] = useState(false); // opponent clicked, waiting for me
  const playerNumRef = useRef(playerNum);

  useEffect(() => {
    playerNumRef.current = playerNum;
  }, [playerNum]);

  useEffect(() => {
    if (!roomCode || !playerName) return;

    const joinPayload = { type: "join", room: roomCode, name: playerName };
    connect(joinPayload);

    const unsub = onMessage((msg) => {
      switch (msg.type) {
        case "joined":
          setJoined(true);
          setPlayerNum(msg.player_num);
          setError(null);
          break;

        case "waiting":
          setWaiting(true);
          break;

        case "rematch_waiting":
          setRematchWaiting(true);
          break;

        case "rematch_requested":
          setRematchRequested(true);
          break;

        case "state":
          setWaiting(false);
          setRematchWaiting(false);
          setRematchRequested(false);
          setGameState(msg.game);
          setNames(msg.names ?? {});
          if (msg.settings) setSettings(msg.settings);
          setServerClocks({
            1: msg.clocks?.["1"] ?? msg.settings?.time_limit ?? 300,
            2: msg.clocks?.["2"] ?? msg.settings?.time_limit ?? 300,
          });
          if (msg.your_player && msg.your_player !== playerNumRef.current) {
            setPlayerNum(msg.your_player);
          }
          break;

        case "error":
          setError(msg.message);
          setTimeout(() => setError(null), 4000);
          break;

        case "opponent_disconnected":
          setOpponentLeft(true);
          break;

        default:
          break;
      }
    });

    return () => {
      unsub();
      disconnect();
    };
  }, [roomCode, playerName]);

  const selectPiece = useCallback((piece) => {
    send({ type: "select_piece", piece });
  }, []);

  const placePiece = useCallback((row, col) => {
    send({ type: "place_piece", row, col });
  }, []);

  const requestRematch = useCallback(() => {
    send({ type: "rematch" });
  }, []);

  return {
    joined,
    playerNum,
    waiting,
    gameState,
    names,
    serverClocks,
    settings,
    error,
    opponentLeft,
    rematchWaiting,
    rematchRequested,
    selectPiece,
    placePiece,
    requestRematch,
  };
}
