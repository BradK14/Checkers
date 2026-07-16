import { cellKey } from '../models/gameState.js';

// Builds reusable geometry and material assets for checker pieces.
function createPieceAssets(THREE) {
	const pieceGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.2, 40);
	const pieceTopGeo = new THREE.TorusGeometry(0.2, 0.06, 16, 48);

	return {
		pieceGeo,
		pieceTopGeo,
		p1Mat: new THREE.MeshStandardMaterial({ color: 0xd94b4b, metalness: 0.2, roughness: 0.45 }),
		p2Mat: new THREE.MeshStandardMaterial({ color: 0xf0f0f0, metalness: 0.2, roughness: 0.35 }),
		p1Selected: new THREE.MeshStandardMaterial({ color: 0xffa45e, metalness: 0.2, roughness: 0.35 }),
		p2Selected: new THREE.MeshStandardMaterial({ color: 0x9fd3ff, metalness: 0.2, roughness: 0.3 })
	};
}

// Creates and places a single checker piece in the scene and board state.
function placePiece(state, sceneCtx, assets, row, col, player) {
	const mat = player === 1 ? assets.p1Mat : assets.p2Mat;
	const piece = new sceneCtx.THREE.Mesh(assets.pieceGeo, mat);
	piece.position.set(col - sceneCtx.boardOffset, 0.2, row - sceneCtx.boardOffset);
	piece.castShadow = true;
	piece.userData = { isPiece: true, row, col, player, king: false };

	const ring = new sceneCtx.THREE.Mesh(
		assets.pieceTopGeo,
		new sceneCtx.THREE.MeshStandardMaterial({ color: 0x1d1d1d, roughness: 0.4 })
	);
	ring.rotation.x = Math.PI / 2;
	ring.position.y = 0.11;
	piece.add(ring);

	sceneCtx.boardGroup.add(piece);
	state.boardState[row][col] = player;
	state.piecesByCell.set(cellKey(row, col), piece);
}

function populateInitialPieces(state, sceneCtx, assets) {
	for (let row = 0; row < 3; row += 1) {
		for (let col = 0; col < state.boardSize; col += 1) {
			if ((row + col) % 2 === 1) placePiece(state, sceneCtx, assets, row, col, 1);
		}
	}

	for (let row = 5; row < state.boardSize; row += 1) {
		for (let col = 0; col < state.boardSize; col += 1) {
			if ((row + col) % 2 === 1) placePiece(state, sceneCtx, assets, row, col, 2);
		}
	}
}

// Populates the initial board positions and returns shared piece assets.
export function initializeGameWorld(state, sceneCtx) {
	const assets = createPieceAssets(sceneCtx.THREE);

	function resetWorld() {
		for (const piece of state.piecesByCell.values()) {
			sceneCtx.boardGroup.remove(piece);
		}

		for (const row of state.boardState) {
			row.fill(0);
		}

		state.piecesByCell.clear();
		state.currentPlayer = 1;
		state.selectedPiece = null;
		state.activeMultiJumpPiece = null;
		state.stats.p1Captured = 0;
		state.stats.p2Captured = 0;
		state.stats.p1Moves = 0;
		state.stats.p2Moves = 0;

		populateInitialPieces(state, sceneCtx, assets);
	}

	resetWorld();

	return { assets, resetWorld };
}
