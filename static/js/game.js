let timerInterval = null;
let secondsElapsed = 0;
let currentSolution = [];
let initialPuzzle = [];
let currentDifficulty = "easy";

const DEFAULT_PUZZLE = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
];

const DEFAULT_SOLUTION = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

class ScoreManager {
    static getScores(difficulty) {
        const scores = localStorage.getItem(`sudoku_top10_${difficulty}`);
        return scores ? JSON.parse(scores) : [];
    }

    static saveScore(name, time, difficulty) {
        let scores = this.getScores(difficulty);
        scores.push({ name, time, date: new Date().toLocaleDateString() });
        scores.sort((a, b) => a.time - b.time);
        scores = scores.slice(0, 10);
        localStorage.setItem(`sudoku_top10_${difficulty}`, JSON.stringify(scores));
        this.renderScores(difficulty);
    }

    static renderScores(difficulty) {
        const list = document.getElementById("scores-list");
        if (!list) return;
        const scores = this.getScores(difficulty);
        list.innerHTML = scores.length === 0 
            ? "<li>No high scores recorded yet.</li>"
            : scores.map((s, idx) => `<li><span>#${idx + 1} ${s.name}</span> <span>${formatTime(s.time)} (${s.date})</span></li>`).join("");
    }
}

function formatTime(totalSecs) {
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

function startTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    const timerElem = document.getElementById("timer");
    if (timerElem) timerElem.textContent = "00:00";
    timerInterval = setInterval(() => {
        secondsElapsed++;
        if (timerElem) timerElem.textContent = formatTime(secondsElapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

async function startNewGame() {
    const banner = document.getElementById("win-banner");
    if (banner) banner.style.display = "none";

    const diffSelect = document.getElementById("difficulty");
    currentDifficulty = diffSelect ? diffSelect.value : "easy";
    
    try {
        const res = await fetch(`/api/new-game?difficulty=${currentDifficulty}`);
        if (!res.ok) throw new Error("API route not found");
        const data = await res.json();
        
        initialPuzzle = data.puzzle;
        currentSolution = data.solution;
    } catch (err) {
        initialPuzzle = DEFAULT_PUZZLE;
        currentSolution = DEFAULT_SOLUTION;
    }

    renderBoard(initialPuzzle);
    ScoreManager.renderScores(currentDifficulty);
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
                input.classList.add("cell-alt");
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
    let hasErrors = false;

    inputs.forEach(input => {
        if (input.readOnly) return;
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        const val = input.value.trim();

        if (val) {
            const num = parseInt(val);
            if (num !== currentSolution[r][c]) {
                input.classList.add("cell-error");
                hasErrors = true;
            } else {
                input.classList.remove("cell-error");
            }
        }
    });

    if (!hasErrors) {
        checkWinCondition();
    }
}

function getHint() {
    const inputs = Array.from(document.querySelectorAll("#sudoku-grid input:not([readonly])"));
    const eligibleInputs = inputs.filter(input => !input.value || input.classList.contains("cell-error"));
    
    if (eligibleInputs.length === 0) return;
    
    const targetInput = eligibleInputs[Math.floor(Math.random() * eligibleInputs.length)];
    const r = parseInt(targetInput.dataset.row);
    const c = parseInt(targetInput.dataset.col);
    
    targetInput.value = currentSolution[r][c];
    targetInput.readOnly = true;
    targetInput.classList.remove("cell-error");
    targetInput.classList.add("cell-hint");
    
    checkWinCondition();
}

function checkWinCondition() {
    const inputs = Array.from(document.querySelectorAll("#sudoku-grid input"));
    const allFilled = inputs.every(input => input.value.trim() !== "");
    if (!allFilled) return;

    const isCorrect = inputs.every(input => {
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        return parseInt(input.value) === currentSolution[r][c];
    });

    if (isCorrect) {
        stopTimer();
        const banner = document.getElementById("win-banner");
        if (banner) {
            banner.textContent = `🎉 Puzzle Solved in ${formatTime(secondsElapsed)}!`;
            banner.style.display = "block";
        }
        setTimeout(() => {
            const name = prompt(`Great job! Solved in ${formatTime(secondsElapsed)}!\nEnter name for Leaderboard:`);
            if (name) {
                ScoreManager.saveScore(name.trim() || "Player", secondsElapsed, currentDifficulty);
            }
        }, 150);
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sudoku_theme", next);
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("sudoku_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const newGameBtn = document.getElementById("new-game-btn");
    const checkBtn = document.getElementById("check-btn");
    const hintBtn = document.getElementById("hint-btn");
    const themeBtn = document.getElementById("theme-toggle");
    const diffSelect = document.getElementById("difficulty");

    if (newGameBtn) newGameBtn.addEventListener("click", startNewGame);
    if (checkBtn) checkBtn.addEventListener("click", checkCurrentBoard);
    if (hintBtn) hintBtn.addEventListener("click", getHint);
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
    if (diffSelect) diffSelect.addEventListener("change", startNewGame);

    startNewGame();
});