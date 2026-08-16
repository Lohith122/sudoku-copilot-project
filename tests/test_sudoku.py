import sys
import os
import pytest

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, SAMPLE_PUZZLE

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_sample_puzzle_structure():
    """Verify that the baseline puzzle is a 9x9 grid."""
    assert len(SAMPLE_PUZZLE) == 9
    for row in SAMPLE_PUZZLE:
        assert len(row) == 9

def test_sample_puzzle_values():
    """Verify all cells contain valid Sudoku digits (0-9)."""
    for row in SAMPLE_PUZZLE:
        for val in row:
            assert 0 <= val <= 9

def test_api_puzzle_endpoint(client):
    """Verify the /api/puzzle route returns the board JSON."""
    response = client.get('/api/puzzle')
    assert response.status_code == 200
    data = response.get_json()
    assert "board" in data
    assert data["board"] == SAMPLE_PUZZLE