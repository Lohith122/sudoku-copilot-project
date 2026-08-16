# Sudoku Copilot Project

A small Flask-based Sudoku game with frontend interactivity (timer, hints, local scoreboard, theme toggle).

Run locally:

```bash
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000/ in your browser.

Files of interest:
- `app.py` — Flask app and puzzle endpoints
- `static/js/game.js` — interactive game logic
- `templates/index.html` — game UI
- `sudoku_generator.py` — puzzle generator (helper)
- `sudoku_solver.py` — solver used for validation
- `tests/` — unit tests
