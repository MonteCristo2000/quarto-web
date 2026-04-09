"""
Quarto game logic — pure module, no networking imports.
"""

_ATTR_LABELS = [
    ("short", "tall"),
    ("light", "dark"),
    ("round", "square"),
    ("solid", "hollow"),
]


def piece_attrs(piece):
    return tuple(_ATTR_LABELS[i][(piece >> i) & 1] for i in range(4))


def common_attributes(pieces):
    return [
        _ATTR_LABELS[i][(pieces[0] >> i) & 1]
        for i in range(4)
        if all((p >> i) & 1 == (pieces[0] >> i) & 1 for p in pieces)
    ]


class QuartoGame:
    # 4 rows + 4 cols + 2 diags
    _LINES = (
        [[(r, c) for c in range(4)] for r in range(4)] +
        [[(r, c) for r in range(4)] for c in range(4)] +
        [[(i, i) for i in range(4)]] +
        [[(i, 3 - i) for i in range(4)]]
    )
    # all 2x2 squares
    _SQUARES = [
        [(r + dr, c + dc) for dr in range(2) for dc in range(2)]
        for r in range(3) for c in range(3)
    ]

    def __init__(self, game_mode="classic", starting_player=1):
        """
        game_mode: "classic" | "color"
          classic — any player may give any available piece
          color   — Player 1 may only give light pieces (bit 1 = 0, cyan)
                    Player 2 may only give dark  pieces (bit 1 = 1, red)
        starting_player: 1 | 2 — who picks the first piece to give
        """
        self.board = [[None] * 4 for _ in range(4)]
        self.available = set(range(16))
        self.current_piece = None
        self.current_player = starting_player
        self.phase = "select"       # "select" | "place"
        self.game_over = False
        self.winner = None          # 1 | 2 | None
        self.winning_line = []
        self.winning_type = ""
        self.game_mode = game_mode  # stored for rule enforcement + client display

    def _color_allowed(self, piece):
        """
        In color mode: Player 1 gives light pieces (color bit = 0),
                       Player 2 gives dark  pieces (color bit = 1).
        Returns True if the piece is allowed for the current player to give.
        """
        if self.game_mode != "color":
            return True
        color_bit = (piece >> 1) & 1          # 0 = light, 1 = dark
        expected   = self.current_player - 1  # P1 → 0, P2 → 1
        return color_bit == expected

    def select_piece(self, piece):
        if self.game_over or self.phase != "select" or piece not in self.available:
            return False
        if not self._color_allowed(piece):
            return False
        self.available.remove(piece)
        self.current_piece = piece
        self.phase = "place"
        self.current_player = 3 - self.current_player
        return True

    def place_piece(self, row, col):
        if (self.game_over or self.phase != "place"
                or not (0 <= row < 4 and 0 <= col < 4)
                or self.board[row][col] is not None):
            return False
        self.board[row][col] = self.current_piece
        self.current_piece = None
        if self._check_win():
            self.game_over = True
            self.winner = self.current_player
        elif not self.available:
            self.game_over = True
        else:
            self.phase = "select"
        return True

    @staticmethod
    def _group_wins(pieces):
        return bool(
            (pieces[0] & pieces[1] & pieces[2] & pieces[3]) |
            (~(pieces[0] | pieces[1] | pieces[2] | pieces[3]) & 0xF)
        )

    def _check_win(self):
        line_names = [
            "Row 0", "Row 1", "Row 2", "Row 3",
            "Column 0", "Column 1", "Column 2", "Column 3",
            "Main diagonal", "Anti-diagonal",
        ]
        for i, grp in enumerate(self._LINES):
            cells = [self.board[r][c] for r, c in grp]
            if all(p is not None for p in cells) and self._group_wins(cells):
                self.winning_line = grp
                self.winning_type = line_names[i]
                return True
        for grp in self._SQUARES:
            cells = [self.board[r][c] for r, c in grp]
            if all(p is not None for p in cells) and self._group_wins(cells):
                self.winning_line = grp
                r0, c0 = grp[0]
                self.winning_type = f"2×2 square at ({r0},{c0})"
                return True
        return False

    def to_dict(self):
        return {
            "board": self.board,
            "available": sorted(self.available),
            "current_piece": self.current_piece,
            "current_player": self.current_player,
            "phase": self.phase,
            "game_over": self.game_over,
            "winner": self.winner,
            "winning_line": [list(cell) for cell in self.winning_line],
            "winning_type": self.winning_type,
            "game_mode": self.game_mode,
        }
