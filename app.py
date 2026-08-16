from flask import Flask, render_template, jsonify, request
import copy

app = Flask(__name__)

# Baseline puzzle & solution
SAMPLE_PUZZLE = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
]

SAMPLE_SOLUTION = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
]

@app.route('/')
def home():
    return render_template('index.html', board=SAMPLE_PUZZLE)

@app.route('/api/puzzle', methods=['GET'])
def get_puzzle():
    return jsonify({"board": SAMPLE_PUZZLE, "solution": SAMPLE_SOLUTION})

@app.route('/api/new-game', methods=['GET'])
def new_game():
    difficulty = request.args.get('difficulty', 'easy')
    try:
        from sudoku_generator import generate_puzzle
        puzzle, solution = generate_puzzle(difficulty)
        return jsonify({
            "puzzle": puzzle,
            "solution": solution,
            "difficulty": difficulty
        })
    except Exception:
        return jsonify({
            "puzzle": SAMPLE_PUZZLE,
            "solution": SAMPLE_SOLUTION,
            "difficulty": difficulty
        })

if __name__ == '__main__':
    app.run(debug=True)