export const BOARD_SIZE = 8;
export const SQUARE_SIZE = 1;

// Creates the initial mutable game state container for a new 3D match.
export function createGameState(boardSize = BOARD_SIZE) {
	return {
		boardSize,
		boardState: Array.from({ length: boardSize }, () => Array(boardSize).fill(0)),
		piecesByCell: new Map(),
		currentPlayer: 1,
		selectedPiece: null,
		activeMultiJumpPiece: null,
		cpuDifficulty: 'easy',
		stats: {
			p1Captured: 0,
			p2Captured: 0,
			p1Moves: 0,
			p2Moves: 0
		}
	};
}

// Builds a stable map key for looking up pieces by board coordinate.
export function cellKey(row, col) {
	return `${row}:${col}`;
}
