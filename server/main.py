"""
FastAPI + WebSocket backend for Quarto.
"""
import asyncio
import json
import random
import string
import time
from typing import Dict, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from game_logic import QuartoGame

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOM_TTL = 3600   # 1 hour inactivity expiry

VALID_GAME_MODES  = {"classic", "color"}
VALID_TIME_LIMITS = {60, 180, 300, 600}   # 1 min (debug), 3 min, 5 min, 10 min


class Room:
    def __init__(self, code: str, game_mode: str = "classic", time_limit: int = 300):
        self.code = code
        self.game_mode  = game_mode
        self.time_limit = time_limit
        self.game = QuartoGame(game_mode=game_mode)
        self.players: Dict[int, Optional[WebSocket]] = {1: None, 2: None}
        self.names: Dict[int, str] = {}
        self.clocks: Dict[int, float] = {1: float(time_limit), 2: float(time_limit)}
        self.clock_started_at: Optional[float] = None
        self.active_clock_player: Optional[int] = None
        self.created_at: float = time.monotonic()
        self.last_activity: float = time.monotonic()
        self.rematch_votes: set = set()
        self.starting_player: int = 1   # alternates each rematch
        self.scores: Dict[str, int] = {"1": 0, "2": 0, "draws": 0}

    def record_result(self):
        """Call after game_over is set to update the score tally."""
        if self.game.winner:
            self.scores[str(self.game.winner)] += 1
        elif self.game.game_over:
            self.scores["draws"] += 1

    def reset_for_rematch(self):
        self.starting_player = 3 - self.starting_player
        self.game = QuartoGame(game_mode=self.game_mode, starting_player=self.starting_player)
        self.clocks = {1: float(self.time_limit), 2: float(self.time_limit)}
        self.clock_started_at = None
        self.active_clock_player = None
        self.rematch_votes = set()

    def assign_player(self, ws: WebSocket) -> Optional[int]:
        """Assign a WebSocket to a free player slot. Returns slot number or None."""
        for slot in (1, 2):
            if self.players[slot] is None:
                self.players[slot] = ws
                return slot
        return None

    def restore_player(self, ws: WebSocket, slot: int):
        self.players[slot] = ws

    def both_connected(self) -> bool:
        return self.players[1] is not None and self.players[2] is not None

    def deduct_clock(self):
        """Deduct elapsed time from the active player's clock. Returns True if timed out."""
        if self.clock_started_at is None or self.active_clock_player is None:
            return False
        elapsed = time.monotonic() - self.clock_started_at
        self.clocks[self.active_clock_player] = max(
            0.0, self.clocks[self.active_clock_player] - elapsed
        )
        self.clock_started_at = time.monotonic()
        return self.clocks[self.active_clock_player] == 0.0

    def start_clock(self, player: int):
        self.active_clock_player = player
        self.clock_started_at = time.monotonic()

    def state_payload(self, your_player: int) -> dict:
        game_dict = self.game.to_dict()
        clocks_snapshot = {
            "1": self.clocks[1],
            "2": self.clocks[2],
        }
        # Interpolate active player's clock for the snapshot
        if self.clock_started_at is not None and self.active_clock_player is not None:
            elapsed = time.monotonic() - self.clock_started_at
            clocks_snapshot[str(self.active_clock_player)] = max(
                0.0, self.clocks[self.active_clock_player] - elapsed
            )
        return {
            "type": "state",
            "game": game_dict,
            "names": {str(k): v for k, v in self.names.items()},
            "clocks": clocks_snapshot,
            "your_player": your_player,
            "settings": {
                "game_mode":  self.game_mode,
                "time_limit": self.time_limit,
            },
            "scores": self.scores,
        }


# Global room registry
rooms: Dict[str, Room] = {}


def generate_code() -> str:
    while True:
        code = "".join(random.choices(string.ascii_uppercase, k=4))
        if code not in rooms:
            return code


def purge_stale_rooms():
    cutoff = time.monotonic() - ROOM_TTL
    stale = [c for c, r in rooms.items() if r.last_activity < cutoff]
    for c in stale:
        del rooms[c]


# ---------------------------------------------------------------------------
# HTTP endpoints
# ---------------------------------------------------------------------------

class CreateRoomRequest(BaseModel):
    game_mode:  str = "classic"
    time_limit: int = 300


class CreateRoomResponse(BaseModel):
    room_code: str
    player_num: int


@app.post("/rooms", response_model=CreateRoomResponse)
async def create_room(body: CreateRoomRequest = None):
    purge_stale_rooms()
    # Sanitise inputs
    if body is None:
        body = CreateRoomRequest()
    game_mode  = body.game_mode  if body.game_mode  in VALID_GAME_MODES  else "classic"
    time_limit = body.time_limit if body.time_limit in VALID_TIME_LIMITS  else 300
    code = generate_code()
    rooms[code] = Room(code, game_mode=game_mode, time_limit=time_limit)
    return {"room_code": code, "player_num": 1}


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    room: Optional[Room] = None
    my_player: Optional[int] = None

    try:
        # First message must be a join
        raw = await ws.receive_text()
        msg = json.loads(raw)

        if msg.get("type") != "join":
            await ws.send_json({"type": "error", "message": "First message must be join"})
            await ws.close()
            return

        room_code = msg.get("room", "").upper()
        player_name = str(msg.get("name", "Player"))[:20]

        if room_code not in rooms:
            await ws.send_json({"type": "error", "message": "Room not found"})
            await ws.close()
            return

        room = rooms[room_code]
        room.last_activity = time.monotonic()

        # Check if reconnecting (same name + slot already taken)
        restored = False
        for slot, existing_name in room.names.items():
            if existing_name == player_name and room.players[slot] is None:
                my_player = slot
                room.restore_player(ws, slot)
                restored = True
                break

        if not restored:
            my_player = room.assign_player(ws)
            if my_player is None:
                await ws.send_json({"type": "error", "message": "Room is full"})
                await ws.close()
                return
            room.names[my_player] = player_name

        await ws.send_json({
            "type": "joined",
            "player_num": my_player,
            "room": room_code,
        })

        if not room.both_connected():
            await ws.send_json({"type": "waiting", "message": "Waiting for opponent..."})
        else:
            # Notify both players
            await broadcast(room, room.state_payload(1), room.state_payload(2))

        # Main message loop
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            room.last_activity = time.monotonic()
            msg_type = msg.get("type")

            if not room.both_connected():
                await ws.send_json({"type": "waiting", "message": "Waiting for opponent..."})
                continue

            game = room.game

            if msg_type == "select_piece":
                if game.phase != "select" or game.current_player != my_player:
                    await ws.send_json({"type": "error", "message": "Not your turn"})
                    continue

                piece = msg.get("piece")
                if piece is None or not isinstance(piece, int):
                    await ws.send_json({"type": "error", "message": "Invalid piece"})
                    continue

                # Deduct clock time
                timed_out = room.deduct_clock()
                if timed_out:
                    game.game_over = True
                    game.winner = 3 - my_player
                    game.winning_type = "timeout"
                    room.record_result()
                    await broadcast(room, room.state_payload(1), room.state_payload(2))
                    continue

                ok = game.select_piece(piece)
                if not ok:
                    await ws.send_json({"type": "error", "message": "Invalid piece selection"})
                    continue

                if game.game_over:
                    room.record_result()
                else:
                    room.start_clock(game.current_player)
                await broadcast(room, room.state_payload(1), room.state_payload(2))

            elif msg_type == "place_piece":
                if game.phase != "place" or game.current_player != my_player:
                    await ws.send_json({"type": "error", "message": "Not your turn"})
                    continue

                row = msg.get("row")
                col = msg.get("col")
                if row is None or col is None:
                    await ws.send_json({"type": "error", "message": "Invalid position"})
                    continue

                # Deduct clock time
                timed_out = room.deduct_clock()
                if timed_out:
                    game.game_over = True
                    game.winner = 3 - my_player
                    game.winning_type = "timeout"
                    room.record_result()
                    await broadcast(room, room.state_payload(1), room.state_payload(2))
                    continue

                ok = game.place_piece(int(row), int(col))
                if not ok:
                    await ws.send_json({"type": "error", "message": "Invalid placement"})
                    continue

                if game.game_over:
                    room.record_result()
                else:
                    room.start_clock(game.current_player)
                await broadcast(room, room.state_payload(1), room.state_payload(2))

            elif msg_type == "reaction":
                emoji = str(msg.get("emoji", ""))[:2]   # cap length, basic safety
                if emoji:
                    await broadcast(room,
                        {"type": "reaction", "from": my_player, "emoji": emoji},
                        {"type": "reaction", "from": my_player, "emoji": emoji},
                    )

            elif msg_type == "rematch":
                if not game.game_over:
                    await ws.send_json({"type": "error", "message": "Game is not over yet"})
                    continue
                room.rematch_votes.add(my_player)
                if len(room.rematch_votes) == 2:
                    # Both agreed — reset and start fresh
                    room.reset_for_rematch()
                    room.start_clock(room.game.current_player)
                    await broadcast(room, room.state_payload(1), room.state_payload(2))
                else:
                    # Notify the voter their request is pending
                    await ws.send_json({"type": "rematch_waiting"})
                    # Notify opponent a rematch was requested
                    opponent = 3 - my_player
                    opp_ws = room.players.get(opponent)
                    if opp_ws is not None:
                        try:
                            await opp_ws.send_json({"type": "rematch_requested"})
                        except Exception:
                            pass

            else:
                await ws.send_json({"type": "error", "message": f"Unknown message type: {msg_type}"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        if room is not None and my_player is not None:
            room.players[my_player] = None
            # Notify opponent
            opponent = 3 - my_player
            opp_ws = room.players.get(opponent)
            if opp_ws is not None:
                try:
                    await opp_ws.send_json({"type": "opponent_disconnected"})
                except Exception:
                    pass


async def broadcast(room: Room, payload1: dict, payload2: dict):
    """Send state to both players."""
    for player_num, payload in ((1, payload1), (2, payload2)):
        ws = room.players.get(player_num)
        if ws is not None:
            try:
                await ws.send_json(payload)
            except Exception:
                room.players[player_num] = None
