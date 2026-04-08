/**
 * WebSocket singleton with automatic reconnect.
 * Usage:
 *   import { connect, send, onMessage, disconnect } from "./ws.js";
 */

// Use the same hostname the browser used to load the page so that phones
// on the same WiFi automatically point at the right machine.
const _host = import.meta.env.VITE_WS_URL
  ? import.meta.env.VITE_WS_URL
  : `ws://${window.location.hostname}:8000/ws`;
const WS_URL = _host;

let socket = null;
let listeners = [];
let reconnectTimer = null;
let reconnectDelay = 1000;
let pendingJoin = null;   // saved join payload for reconnect
let shouldReconnect = true;

function notifyAll(msg) {
  listeners.forEach((fn) => fn(msg));
}

function openSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    reconnectDelay = 1000;
    if (pendingJoin) {
      socket.send(JSON.stringify(pendingJoin));
    }
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      notifyAll(msg);
    } catch (e) {
      console.error("WS parse error", e);
    }
  };

  socket.onclose = () => {
    socket = null;
    if (shouldReconnect && pendingJoin) {
      reconnectTimer = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 1.5, 8000);
        openSocket();
      }, reconnectDelay);
    }
  };

  socket.onerror = () => {
    // onclose will handle reconnect
  };
}

export function connect(joinPayload) {
  shouldReconnect = true;
  pendingJoin = joinPayload;
  openSocket();
}

export function send(msg) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
    return true;
  }
  return false;
}

export function onMessage(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function disconnect() {
  shouldReconnect = false;
  pendingJoin = null;
  clearTimeout(reconnectTimer);
  if (socket) {
    socket.close();
    socket = null;
  }
  listeners = [];
}
