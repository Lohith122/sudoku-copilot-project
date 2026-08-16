let timerInterval = null;
let secondsElapsed = 0;
let currentSolution = [];
let initialPuzzle = [];
let currentDifficulty = "medium";
let hintsUsed = 0;
let noteMode = false;

const DEFAULT_PUZZLE = [
    [8, 0, 7, 3, 9, 0, 0, 2, 0],
    [9, 1, 0, 0, 7, 0, 0, 0, 0],
    [0, 3, 0, 2, 0, 1, 0, 0, 0],
    [1, 0, 3, 0, 0, 0, 4, 5, 6],
    [0, 0, 0, 0, 0, 0, 8, 0, 3],
    [0, 9, 0, 5, 3, 0, 0, 0, 0],
    [2, 0, 9, 0, 0, 0, 0, 1, 4],
    [0, 0, 0, 0, 5, 0, 0, 0, 0],
    [6, 4, 8, 9, 0, 0, 5, 3, 0]
];

const DEFAULT_SOLUTION = [
    [8, 5, 7, 3, 9, 4, 6, 2, 1],
    [9, 1, 2, 6, 7, 5, 3, 4, 8],
    [4, 3, 6, 2, 8, 1, 9, 7, 5],
    [1, 8, 3, 7, 2, 9, 4, 5, 6],
    [5, 2, 4, 1, 6, 8, 7, 9, 3],
    [7, 9, 1, 5, 3, 4, 2, 8, 0],
    [2, 7, 9, 8, 4, 3, 5, 1, 4],
    [3, 6, 5, 4, 5, 2, 1, 6, 9],
    [6, 4, 8, 9, 1, 7, 5, 3, 2]
];

class ScoreManager {
    static getScores() {
        const scores = localStorage.getItem("sudoku_top10_scores");
        return scores ? JSON.parse(scores) : [];
    }

    static saveScore(name, time, level, hints) {
        let scores = this.getScores();
        scores.push({ name, time, level, hints });
        scores.sort((a, b) => a.time - b.time);
        scores = scores.slice(0, 10);
        localStorage.setItem("sudoku_top10_scores", JSON.stringify(scores));
        this.renderScores();
    }

    static renderScores() {
        const tbody = document.getElementById("scores-tbody");
        if (!tbody) return;
        const scores = this.getScores();

        if (scores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1rem;">
                        No records yet. Solve a puzzle to enter the leaderboard!
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = scores.map((s, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${s.name}</td>
                <td>${formatTime(s.time)}</td>
                <td>${s.level}</td>
                <td>${s.hints}</td>
            </tr>
        `).join("");
    }
}

function formatTime(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

function startTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    const timerElem = document.getElementById("timer");
    if (timerElem) timerElem.textContent = "0:00";
    timerInterval = setInterval(() => {
        secondsElapsed++;
        if (timerElem) timerElem.textContent = formatTime(secondsElapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

async function startNewGame() {
    hintsUsed = 0;
    const diffSelect = document.getElementById("difficulty");
    currentDifficulty = diffSelect ? diffSelect.value : "medium";

    try {
        const res = await fetch(`/api/new-game?difficulty=${currentDifficulty}`);
        if (!res.ok) throw new Error("API not available");
        const data = await res.json();
        initialPuzzle = data.puzzle;
        currentSolution = data.solution;
    } catch (err) {
        initialPuzzle = DEFAULT_PUZZLE;
        currentSolution = DEFAULT_SOLUTION;
    }

    renderBoard(initialPuzzle);
    ScoreManager.renderScores();
    startTimer();
}

function renderBoard(board) {
    const grid = document.getElementById("sudoku-grid");
    if (!grid) return;
    grid.innerHTML = "";

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            input.dataset.row = r;
            input.dataset.col = c;
            input.classList.add("cell");

            const boxRow = Math.floor(r / 3);
            const boxCol = Math.floor(c / 3);
            if ((boxRow + boxCol) % 2 === 1) {
                input.classList.add("box-pink");
            } else {
                input.classList.add("box-blue");
            }

            if (board[r][c] !== 0) {
                input.value = board[r][c];
                input.readOnly = true;
                input.classList.add("cell-locked");
            } else {
                input.addEventListener("input", (e) => handleCellInput(e, r, c));
            }
            grid.appendChild(input);
        }
    }
}

function handleCellInput(e, r, c) {
    const input = e.target;
    const val = input.value.trim();

    if (!/^[1-9]$/.test(val)) {
        input.value = "";
        input.classList.remove("cell-error");
        return;
    }

    const num = parseInt(val);
    if (currentSolution && currentSolution.length > 0 && num !== currentSolution[r][c]) {
        input.classList.add("cell-error");
    } else {
        input.classList.remove("cell-error");
    }

    checkWinCondition();
}

function checkCurrentBoard() {
    const inputs = document.querySelectorAll("#sudoku-grid input");
    inputs.forEach(input => {
        if (input.readOnly) return;
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        const val = input.value.trim();

        if (val) {
            const num = parseInt(val);
            if (num !== currentSolution[r][c]) {
                input.classList.add("cell-error");
            } else {
                input.classList.remove("cell-error");
            }
        }
    });
}

function getHint() {
    const inputs = Array.from(document.querySelectorAll("#sudoku-grid input:not([readonly])"));
    const eligible = inputs.filter(input => !input.value || input.classList.contains("cell-error"));
    if (eligible.length === 0) return;

    const target = eligible[Math.floor(Math.random() * eligible.length)];
    const r = parseInt(target.dataset.row);
    const c = parseInt(target.dataset.col);

    target.value = currentSolution[r][c];
    target.readOnly = true;
    target.classList.remove("cell-error");
    target.classList.add("cell-hint");
    hintsUsed++;

    checkWinCondition();
}

function toggleNoteMode() {
    noteMode = !noteMode;
    const status = document.getElementById("note-status");
    if (status) status.textContent = noteMode ? "On" : "Off";
}

function visualSolver() {
    const inputs = document.querySelectorAll("#sudoku-grid input");
    inputs.forEach(input => {
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        input.value = currentSolution[r][c];
        input.classList.remove("cell-error");
    });
    checkWinCondition();
}

function checkWinCondition() {
    const inputs = Array.from(document.querySelectorAll("#sudoku-grid input"));
    const isComplete = inputs.every(input => input.value.trim() !== "");
    if (!isComplete) return;

    const isAllCorrect = inputs.every(input => {
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        return parseInt(input.value) === currentSolution[r][c];
    });

    if (isAllCorrect) {
        stopTimer();
        setTimeout(() => {
            const name = prompt(`🎉 Puzzle Solved in ${formatTime(secondsElapsed)}!\nEnter your name for the leaderboard:`);
            if (name) {
                ScoreManager.saveScore(name.trim() || "Player", secondsElapsed, currentDifficulty, hintsUsed);
            }
        }, 200);
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = next === "dark" ? "🌙" : "☀️";
    localStorage.setItem("sudoku_theme", next);
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("sudoku_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) themeBtn.textContent = savedTheme === "dark" ? "🌙" : "☀️";

    document.getElementById("new-game-btn")?.addEventListener("click", startNewGame);
    document.getElementById("check-btn")?.addEventListener("click", checkCurrentBoard);
    document.getElementById("hint-btn")?.addEventListener("click", getHint);
    document.getElementById("note-btn")?.addEventListener("click", toggleNoteMode);
    document.getElementById("solver-btn")?.addEventListener("click", visualSolver);
    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
    document.getElementById("difficulty")?.addEventListener("change", startNewGame);

    startNewGame();
});