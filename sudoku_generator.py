import copy
import random
from typing import List, Optional

from sudoku_solver import Board, is_valid, count_solutions


def generate_complete_board() -> Board:
    board: Board = [[0 for _ in range(9)] for _ in range(9)]

    def backtrack() -> bool:
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    nums = list(range(1, 10))
                    random.shuffle(nums)
                    for n in nums:
                        if is_valid(board, i, j, n):
                            board[i][j] = n
                            if backtrack():
                                return True
                            board[i][j] = 0
                    return False
        return True

    backtrack()
    return board


def remove_numbers(board: Board, clues: int) -> Board:
    if not (17 <= clues <= 81):
        raise ValueError("clues must be between 17 and 81")
    cells = [(r, c) for r in range(9) for c in range(9)]
    random.shuffle(cells)
    current_nonzeros = sum(1 for r in range(9) for c in range(9) if board[r][c] != 0)
    target_nonzeros = clues
    b = board
    for r, c in cells:
        if current_nonzeros <= target_nonzeros:
            break
        if b[r][c] == 0:
            continue
        saved = b[r][c]
        b[r][c] = 0
        # ensure uniqueness
        copy_board = copy.deepcopy(b)
        sols = count_solutions(copy_board, limit=2)
        if sols != 1:
            b[r][c] = saved
        else:
            current_nonzeros -= 1
    return b


def generate_puzzle(difficulty: str = "medium", max_attempts: int = 10) -> Board:
    mapping = {
        "easy": 45,
        "medium": 35,
        "hard": 28,
    }
    if difficulty not in mapping:
        raise ValueError("difficulty must be one of: easy, medium, hard")
    clues = mapping[difficulty]
    for attempt in range(max_attempts):
        full = generate_complete_board()
        puzzle = remove_numbers(copy.deepcopy(full), clues)
        if sum(1 for r in range(9) for c in range(9) if puzzle[r][c] != 0) == clues:
            return puzzle
    raise RuntimeError("Failed to generate a unique-solution puzzle after several attempts")


__all__ = ["generate_complete_board", "remove_numbers", "generate_puzzle"]
