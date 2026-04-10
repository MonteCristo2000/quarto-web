"""
Quarto AI agent — minimax with alpha-beta pruning.

Difficulty maps to search depth (plies, where 1 ply = one phase action):
  easy   → depth 1  (purely reactive, easy to beat)
  medium → depth 3  (decent play, blocks obvious threats)
  hard   → depth 5  (strong, plans several moves ahead)
"""

from game_logic import QuartoGame

DIFFICULTY_DEPTH = {"easy": 1, "medium": 3, "hard": 4}
INF = float("inf")


def get_ai_move(game: QuartoGame, difficulty: str = "medium"):
    """
    Given a game snapshot where it is the AI's turn,
    return ("place", row, col) or ("select", piece).
    Call with game.clone() to avoid mutating the live game state.
    """
    depth     = DIFFICULTY_DEPTH.get(difficulty, 3)
    ai_player = game.current_player

    if game.phase == "place":
        row, col = _best_place(game, depth, ai_player)
        return ("place", row, col)
    else:
        piece = _best_select(game, depth, ai_player)
        return ("select", piece)


# ---------------------------------------------------------------------------
# Root-level search (always maximising — AI is the root caller)
# ---------------------------------------------------------------------------

def _best_place(game, depth, ai_player):
    best_score, best_move = -INF, None
    alpha = -INF
    for r, c in _ordered_place_moves(game):
        g2 = game.clone()
        g2.place_piece(r, c)
        score = _minimax(g2, depth - 1, alpha, INF, ai_player)
        if score > best_score:
            best_score, best_move = score, (r, c)
        alpha = max(alpha, score)
        if alpha >= INF:
            break
    return best_move


def _best_select(game, depth, ai_player):
    best_score, best_move = -INF, None
    alpha = -INF
    for piece in _ordered_select_moves(game):
        g2 = game.clone()
        g2.select_piece(piece)
        score = _minimax(g2, depth - 1, alpha, INF, ai_player)
        if score > best_score:
            best_score, best_move = score, piece
        alpha = max(alpha, score)
        if alpha >= INF:
            break
    return best_move


# ---------------------------------------------------------------------------
# Minimax with alpha-beta pruning
# ---------------------------------------------------------------------------

def _minimax(game, depth, alpha, beta, ai_player):
    if game.game_over or depth == 0:
        return _evaluate(game, ai_player)

    is_max = game.current_player == ai_player

    if is_max:
        best = -INF
        for move in _moves(game):
            g2 = game.clone()
            _apply(g2, move)
            val = _minimax(g2, depth - 1, alpha, beta, ai_player)
            if val > best:
                best = val
            if val > alpha:
                alpha = val
            if alpha >= beta:
                break
        return best
    else:
        best = INF
        for move in _moves(game):
            g2 = game.clone()
            _apply(g2, move)
            val = _minimax(g2, depth - 1, alpha, beta, ai_player)
            if val < best:
                best = val
            if val < beta:
                beta = val
            if alpha >= beta:
                break
        return best


# ---------------------------------------------------------------------------
# Move generation
# ---------------------------------------------------------------------------

def _moves(game):
    if game.phase == "place":
        return [(r, c) for r in range(4) for c in range(4) if game.board[r][c] is None]
    else:
        return [p for p in sorted(game.available) if game._color_allowed(p)]


def _apply(game, move):
    if isinstance(move, tuple):
        game.place_piece(move[0], move[1])
    else:
        game.select_piece(move)


# ---------------------------------------------------------------------------
# Move ordering — dramatically improves alpha-beta efficiency
# ---------------------------------------------------------------------------

def _ordered_place_moves(game):
    """Immediate winning moves first, then the rest."""
    piece = game.current_piece
    winning, rest = [], []
    for r in range(4):
        for c in range(4):
            if game.board[r][c] is None:
                if _would_win(game.board, r, c, piece):
                    winning.append((r, c))
                else:
                    rest.append((r, c))
    return winning + rest


def _ordered_select_moves(game):
    """Pieces that don't hand the opponent an immediate win first."""
    safe, risky = [], []
    for piece in sorted(game.available):
        if not game._color_allowed(piece):
            continue
        if _piece_lets_opponent_win(game.board, piece):
            risky.append(piece)
        else:
            safe.append(piece)
    return safe + risky


def _would_win(board, row, col, piece):
    """Check if placing piece at (row, col) completes a winning group."""
    board[row][col] = piece
    result = False
    for grp in QuartoGame._LINES:
        cells = [board[r][c] for r, c in grp]
        if all(p is not None for p in cells) and QuartoGame._group_wins(cells):
            result = True
            break
    if not result:
        for grp in QuartoGame._SQUARES:
            cells = [board[r][c] for r, c in grp]
            if all(p is not None for p in cells) and QuartoGame._group_wins(cells):
                result = True
                break
    board[row][col] = None  # undo
    return result


def _piece_lets_opponent_win(board, piece):
    """True if the opponent can immediately win using this piece."""
    for r in range(4):
        for c in range(4):
            if board[r][c] is None and _would_win(board, r, c, piece):
                return True
    return False


# ---------------------------------------------------------------------------
# Static evaluation / heuristic
# ---------------------------------------------------------------------------

def _evaluate(game, ai_player):
    if game.game_over:
        if game.winner == ai_player:
            return 10000
        if game.winner is not None:
            return -10000
        return 0  # draw

    score = 0
    all_groups = list(QuartoGame._LINES) + list(QuartoGame._SQUARES)

    for group in all_groups:
        pieces = [game.board[r][c] for r, c in group if game.board[r][c] is not None]
        n = len(pieces)
        if n == 0:
            continue

        # Check if all placed pieces share at least one attribute (group still has potential)
        has_potential = any(
            len({(p >> bit) & 1 for p in pieces}) == 1
            for bit in range(4)
        )

        if has_potential:
            threat = n * n  # 1, 4, 9 for n = 1, 2, 3
            if game.phase == "place":
                # The player about to place benefits from these threats
                if game.current_player == ai_player:
                    score += threat
                else:
                    score -= threat
            # In select phase, threats are neutral (small incentive to build)
            else:
                score += 1

    return score
