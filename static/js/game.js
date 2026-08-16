// Game logic for Sudoku
(function(){
  const apiPuzzle = '/api/puzzle';
  const apiSolution = '/api/solution';

  let solution = null;
  let puzzle = null;
  let inputs = [];
  let timerInterval = null;
  let seconds = 0;
  const timerEl = () => document.getElementById('timer');
  const winBanner = () => document.getElementById('winBanner');

  class ScoreManager {
    constructor(key = 'sudoku_top_scores'){
      this.key = key;
      this.scores = this._load();
    }
    _load(){
      try{
        const raw = localStorage.getItem(this.key);
        if(!raw) return [];
        return JSON.parse(raw);
      }catch(e){ return []; }
    }
    _save(){
      localStorage.setItem(this.key, JSON.stringify(this.scores));
    }
    addScore({name, timeSec, difficulty}){
      const entry = {name: name || 'Anonymous', time: timeSec, difficulty, date: new Date().toISOString()};
      this.scores.push(entry);
      this.scores.sort((a,b)=>a.time - b.time);
      if(this.scores.length>10) this.scores = this.scores.slice(0,10);
      this._save();
    }
    getTop(){ return this.scores.slice(0,10); }
  }

  const scoreManager = new ScoreManager();

  function pad(n){return n.toString().padStart(2,'0');}
  function renderTimer(){
    const el = timerEl(); if(!el) return;
    el.textContent = `${pad(Math.floor(seconds/60))}:${pad(seconds%60)}`;
  }
  function startTimer(){
    stopTimer();
    timerInterval = setInterval(()=>{ seconds++; renderTimer(); },1000);
  }
  function stopTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval=null; } }

  function inferDifficulty(board){
    let clues = 0; for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(board[r][c]) clues++;
    if(clues>=36) return 'easy';
    if(clues>=28) return 'medium';
    return 'hard';
  }

  function fetchPuzzleAndSolution(){
    return Promise.all([
      fetch(apiPuzzle).then(r=>r.json()),
      fetch(apiSolution).then(r=>r.json())
    ]).then(([p,s])=>{
      puzzle = p.board;
      solution = s.board;
    });
  }

  function mapInputs(){
    inputs = Array.from(document.querySelectorAll('#sudoku input'));
    inputs.forEach(inp=>{
      inp.addEventListener('input', onCellInput);
      inp.addEventListener('keydown', onCellKeyDown);
    });
  }

  function onCellKeyDown(e){
    // allow navigation with arrow keys
    const k = e.key;
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)) return;
    e.preventDefault();
    const inp = e.target;
    const row = parseInt(inp.dataset.row,10);
    const col = parseInt(inp.dataset.col,10);
    let r=row,c=col;
    if(k==='ArrowUp') r = Math.max(0,row-1);
    if(k==='ArrowDown') r = Math.min(8,row+1);
    if(k==='ArrowLeft') c = Math.max(0,col-1);
    if(k==='ArrowRight') c = Math.min(8,col+1);
    const idx = r*9 + c;
    const next = inputs.find(i=>parseInt(i.dataset.row,10)===r && parseInt(i.dataset.col,10)===c);
    if(next) next.focus();
  }

  function onCellInput(e){
    const inp = e.target;
    const r = parseInt(inp.dataset.row,10);
    const c = parseInt(inp.dataset.col,10);
    const val = inp.value;
    // clear error if corrected or emptied
    if(inp.classList.contains('cell-error')){
      if(!val || (solution && parseInt(val,10)===solution[r][c])) inp.classList.remove('cell-error');
    }
    checkWin();
  }

  function applyPrefilled(){
    if(!puzzle) return;
    for(const inp of inputs){
      const r = parseInt(inp.dataset.row,10);
      const c = parseInt(inp.dataset.col,10);
      const val = puzzle[r][c];
      if(val){
        inp.value = val;
        inp.readOnly = true;
        inp.classList.add('given');
        inp.dataset.prefilled = 'true';
        inp.tabIndex = -1;
      }
    }
  }

  function checkButton(){
    if(!solution) return;
    let anyError = false;
    for(const inp of inputs){
      if(inp.dataset.prefilled) continue;
      const r = parseInt(inp.dataset.row,10);
      const c = parseInt(inp.dataset.col,10);
      const val = inp.value;
      if(!val) continue;
      if(parseInt(val,10)!==solution[r][c]){
        inp.classList.add('cell-error');
        anyError = true;
      } else {
        inp.classList.remove('cell-error');
      }
    }
    return !anyError;
  }

  function hintButton(){
    if(!solution) return;
    // find an empty cell that is not prefilled and not hinted
    const candidate = inputs.find(inp=>{
      if(inp.dataset.prefilled) return false;
      if(inp.dataset.hinted) return false;
      return !inp.value;
    });
    if(!candidate) return;
    const r = parseInt(candidate.dataset.row,10);
    const c = parseInt(candidate.dataset.col,10);
    candidate.value = solution[r][c];
    candidate.readOnly = true;
    candidate.dataset.hinted = 'true';
    candidate.classList.add('cell-hint');
    checkWin();
  }

  function checkWin(){
    if(!solution) return false;
    for(const inp of inputs){
      const r = parseInt(inp.dataset.row,10);
      const c = parseInt(inp.dataset.col,10);
      const val = inp.value;
      if(!val || parseInt(val,10)!==solution[r][c]) return false;
    }
    // all match
    onWin();
    return true;
  }

  function onWin(){
    stopTimer();
    const banner = winBanner(); if(banner) banner.style.display='block';
    // record score
    const name = (document.getElementById('playerName')||{}).value || 'Anonymous';
    const diff = inferDifficulty(puzzle||[]);
    scoreManager.addScore({name, timeSec: seconds, difficulty: diff});
    renderTopScores();
  }

  function renderTopScores(){
    const list = document.getElementById('topScores');
    if(!list) return;
    list.innerHTML = '';
    const top = scoreManager.getTop();
    top.forEach(s=>{
      const li = document.createElement('li');
      const d = new Date(s.date);
      li.textContent = `${s.name} — ${s.time}s — ${s.difficulty} — ${d.toLocaleDateString()}`;
      list.appendChild(li);
    });
  }

  function attachControls(){
    const checkBtn = document.getElementById('checkBtn');
    const hintBtn = document.getElementById('hintBtn');
    const themeToggle = document.getElementById('themeToggle');
    if(checkBtn) checkBtn.addEventListener('click', ()=>{ checkButton(); });
    if(hintBtn) hintBtn.addEventListener('click', ()=>{ hintButton(); });

    // theme handling
    const saved = localStorage.getItem('sudoku_theme');
    const doc = document.documentElement;
    if(saved) doc.setAttribute('data-theme', saved);
    const updateThemeButton = ()=>{
      const current = doc.getAttribute('data-theme')||'light';
      if(themeToggle) themeToggle.textContent = current==='dark' ? 'Light' : 'Dark';
    };
    updateThemeButton();
    if(themeToggle) themeToggle.addEventListener('click', ()=>{
      const current = doc.getAttribute('data-theme')||'light';
      const next = current==='light' ? 'dark' : 'light';
      doc.setAttribute('data-theme', next);
      localStorage.setItem('sudoku_theme', next);
      updateThemeButton();
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', ()=>{
    mapInputs();
    attachControls();
    renderTopScores();
    fetchPuzzleAndSolution().then(()=>{
      applyPrefilled();
      seconds = 0; renderTimer(); startTimer();
    }).catch(err=>{
      console.error('Failed to load puzzle/solution',err);
    });
  });
})();
