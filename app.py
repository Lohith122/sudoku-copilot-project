from flask import Flask, render_template, jsonify
from sudoku_solver import solve_and_return

app = Flask(__name__)

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

@app.route('/')
def home():
    return render_template('index.html', board=SAMPLE_PUZZLE)

@app.route('/api/puzzle', methods=['GET'])
def get_puzzle():
    return jsonify({"board": SAMPLE_PUZZLE})


@app.route('/api/solution', methods=['GET'])
def get_solution():
    solved = solve_and_return(SAMPLE_PUZZLE)
    if solved is None:
        return jsonify({"board": None}), 500
    return jsonify({"board": solved})

if __name__ == '__main__':
    app.run(debug=True)