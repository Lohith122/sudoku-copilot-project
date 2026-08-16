import copy
from typing import List, Optional, Tuple

Board = List[List[int]]


def find_empty(board: Board) -> Optional[Tuple[int, int]]:
    for i in range(9):
        for j in range(9):
            if board[i][j] == 0:
                return i, j
    return None


def is_valid(board: Board, row: int, col: int, num: int) -> bool:
    box_row = (row // 3) * 3
    box_col = (col // 3) * 3
    for i in range(9):
        # Row check (early exit)
        if board[row][i] == num:
            return False

        # Column check (early exit)
        if board[i][col] == num:
            return False

        # Box check (map i -> 3x3 coordinates)
        br = box_row + (i // 3)
        bc = box_col + (i % 3)
        if board[br][bc] == num:
            return False

    return True


def solve(board: Board) -> bool:
    """Solve the Sudoku in-place using backtracking. Returns True if solved."""
    empty = find_empty(board)
    if not empty:
        return True
    row, col = empty
    for num in range(1, 10):
        if is_valid(board, row, col, num):
            board[row][col] = num
            if solve(board):
                return True
            board[row][col] = 0
    return False


def solve_and_return(board: Board) -> Optional[Board]:
    b = copy.deepcopy(board)
    if solve(b):
        return b
    return None


def count_solutions(board: Board, limit: Optional[int] = None) -> int:
    """Count total number of solutions for the given board.

    If `limit` is provided, stop searching once count reaches `limit`.
    """
    b = copy.deepcopy(board)
    count = 0

    def backtrack() -> None:
        nonlocal count
        if limit is not None and count >= limit:
            return
        empty = find_empty(b)
        if not empty:
            count += 1
            return
        r, c = empty
        for n in range(1, 10):
            if is_valid(b, r, c, n):
                b[r][c] = n
                backtrack()
                b[r][c] = 0
                if limit is not None and count >= limit:
                    return

    backtrack()
    return count


__all__ = ["Board", "solve", "solve_and_return", "count_solutions", "is_valid"]
