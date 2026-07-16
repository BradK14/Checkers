import { cellKey } from '../models/gameState.js';

// Creates the main 3D game controller and wires state, UI, scene, and rules.
export function createGameController(state, dom, sceneCtx, gameWorld) {
	const { assets, resetWorld } = gameWorld;
	const raycaster = new sceneCtx.THREE.Raycaster();
	const pointer = new sceneCtx.THREE.Vector2();
	let isAnimatingMove = false;
	let renderLoopId = null;
	let isRenderActive = false;
	let lastFrameTimeMs = 0;

	// Syncs stats values from game state to the sidebar UI.
	function updateStatsUI() {
		dom.p1CapturedEl.textContent = String(state.stats.p1Captured);
		dom.p2CapturedEl.textContent = String(state.stats.p2Captured);
		dom.p1MovesEl.textContent = String(state.stats.p1Moves);
		dom.p2MovesEl.textContent = String(state.stats.p2Moves);
	}

	// Updates the top status line with contextual game messages.
	function setStatus(text) {
		dom.statusEl.textContent = text;
	}

	// Flips the turn bar to indicate which player is active.
	function updateTurnIndicator() {
		if (state.currentPlayer === 1) {
			dom.turnEl.style.background = 'linear-gradient(to right, #9ee37d 50%, transparent 50%)';
		} else {
			dom.turnEl.style.background = 'linear-gradient(to right, transparent 50%, #9ee37d 50%)';
		}
	}

	// Sets the winner label once end-game is reached.
	function setWinner(winnerText) {
		dom.winnerEl.textContent = winnerText;
	}

	function syncHudAfterReset() {
		setStatus(`Turn: Player ${state.currentPlayer}`);
		setWinner('None');
		updateStatsUI();
		updateTurnIndicator();
	}

	// Checks remaining pieces and declares a winner when one side is eliminated.
	function maybeDeclareWinner() {
		const pieces = Array.from(state.piecesByCell.values());
		const p1Remaining = pieces.filter((piece) => piece.userData.player === 1).length;
		const p2Remaining = pieces.filter((piece) => piece.userData.player === 2).length;
		if (p1Remaining === 0) setWinner('Player 2');
		if (p2Remaining === 0) setWinner('Player 1');
	}

	// Clears visual selection state from the currently selected piece.
	function clearSelection() {
		if (!state.selectedPiece) return;
		state.selectedPiece.material = state.selectedPiece.userData.player === 1 ? assets.p1Mat : assets.p2Mat;
		state.selectedPiece = null;
	}

	// Validates board coordinates are inside playable bounds.
	function inBounds(row, col) {
		return row >= 0 && row < state.boardSize && col >= 0 && col < state.boardSize;
	}

	// Returns legal movement directions for a piece (king vs non-king).
	function getPieceMoveDirections(piece) {
		const { player, king } = piece.userData;
		if (king) return [[1, -1], [1, 1], [-1, -1], [-1, 1]];
		const forwardStep = player === 1 ? 1 : -1;
		return [[forwardStep, -1], [forwardStep, 1]];
	}

	// Computes all valid capture jumps currently available to a piece.
	function getAvailableCapturePlans(piece) {
		const { row, col, player } = piece.userData;
		const directions = getPieceMoveDirections(piece);
		const plans = [];

		for (const [dRow, dCol] of directions) {
			const targetRow = row + dRow * 2;
			const targetCol = col + dCol * 2;
			const midRow = row + dRow;
			const midCol = col + dCol;

			if (!inBounds(targetRow, targetCol) || !inBounds(midRow, midCol)) continue;
			if (state.boardState[targetRow][targetCol] !== 0) continue;

			const midOccupant = state.boardState[midRow][midCol];
			if (midOccupant !== 0 && midOccupant !== player) {
				plans.push({ type: 'capture', targetRow, targetCol, midRow, midCol });
			}
		}

		return plans;
	}

	// Indicates whether a given piece can perform at least one capture.
	function pieceHasCapture(piece) {
		return getAvailableCapturePlans(piece).length > 0;
	}

	// Indicates whether the active player has any mandatory captures.
	function playerHasCapture(player) {
		for (const piece of state.piecesByCell.values()) {
			if (piece.userData.player !== player) continue;
			if (pieceHasCapture(piece)) return true;
		}
		return false;
	}

	// Builds a move descriptor for simple moves or captures, or null if illegal.
	function getMovePlan(piece, targetRow, targetCol) {
		const { row, col, player } = piece.userData;
		const rowDelta = targetRow - row;
		const colDelta = targetCol - col;
		const absColDelta = Math.abs(colDelta);
		const directions = getPieceMoveDirections(piece);

		if (!inBounds(targetRow, targetCol)) return null;

		const isLegalSimpleDirection = directions.some(([dRow, dCol]) => rowDelta === dRow && colDelta === dCol);
		if (isLegalSimpleDirection) {
			return { type: 'simple' };
		}

		const isLegalCaptureVector = directions.some(([dRow, dCol]) => rowDelta === dRow * 2 && colDelta === dCol * 2);
		if (isLegalCaptureVector && absColDelta === 2) {
			const midRow = row + rowDelta / 2;
			const midCol = col + colDelta / 2;
			const midOccupant = state.boardState[midRow][midCol];
			if (midOccupant !== 0 && midOccupant !== player) {
				return { type: 'capture', midRow, midCol };
			}
		}

		return null;
	}

	// Selects a piece while enforcing turn ownership and force-capture constraints.
	function trySelectPiece(piece) {
		if (state.activeMultiJumpPiece && piece !== state.activeMultiJumpPiece) return;
		if (piece.userData.player !== state.currentPlayer) return;
		if (!state.activeMultiJumpPiece && playerHasCapture(state.currentPlayer) && !pieceHasCapture(piece)) {
			setStatus(`Turn: Player ${state.currentPlayer} | Capture is required`);
			return;
		}
		clearSelection();
		state.selectedPiece = piece;
		state.selectedPiece.material = state.currentPlayer === 1 ? assets.p1Selected : assets.p2Selected;
	}

	// Finalizes a turn when no additional capture is required.
	function finishTurn() {
		state.activeMultiJumpPiece = null;
		clearSelection();
		state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
		setStatus(`Turn: Player ${state.currentPlayer}`);
		updateTurnIndicator();
	}

	function resetGame() {
		if (isAnimatingMove) return;
		resetWorld();
		syncHudAfterReset();
	}

	// Animates a piece from source to target with a small jump arc.
	function animatePieceMove(piece, targetX, targetZ, isCapture) {
		const startX = piece.position.x;
		const startY = piece.position.y;
		const startZ = piece.position.z;
		const durationMs = isCapture ? 320 : 230;
		const jumpHeight = isCapture ? 0.5 : 0.22;

		// Applies ease-in-out timing for smoother movement.
		function easeInOutQuad(t) {
			return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
		}

		return new Promise((resolve) => {
			const start = performance.now();

			function tick(now) {
				const raw = Math.min((now - start) / durationMs, 1);
				const eased = easeInOutQuad(raw);
				const arc = Math.sin(Math.PI * raw) * jumpHeight;

				piece.position.x = startX + (targetX - startX) * eased;
				piece.position.z = startZ + (targetZ - startZ) * eased;
				piece.position.y = startY + arc;

				if (raw < 1) {
					requestAnimationFrame(tick);
					return;
				}

				piece.position.set(targetX, startY, targetZ);
				resolve();
			}

			requestAnimationFrame(tick);
		});
	}

	// Executes a validated move, including captures, stats, and turn transitions.
	async function movePiece(piece, targetRow, targetCol, movePlan) {
		if (isAnimatingMove) return;
		isAnimatingMove = true;

		const { row, col, player } = piece.userData;
		const wasCapture = movePlan.type === 'capture';
		const targetX = targetCol - sceneCtx.boardOffset;
		const targetZ = targetRow - sceneCtx.boardOffset;

		let capturedPiece = null;
		if (wasCapture) {
			capturedPiece = state.piecesByCell.get(cellKey(movePlan.midRow, movePlan.midCol)) ?? null;
		}

		await animatePieceMove(piece, targetX, targetZ, wasCapture);

		if (capturedPiece) {
			const capturedKey = cellKey(movePlan.midRow, movePlan.midCol);
			sceneCtx.boardGroup.remove(capturedPiece);
			state.piecesByCell.delete(capturedKey);
			state.boardState[movePlan.midRow][movePlan.midCol] = 0;
			if (player === 1) state.stats.p1Captured += 1;
			if (player === 2) state.stats.p2Captured += 1;
		}

		state.boardState[row][col] = 0;
		state.piecesByCell.delete(cellKey(row, col));

		piece.userData.row = targetRow;
		piece.userData.col = targetCol;
		piece.position.set(targetX, 0.2, targetZ);

		state.boardState[targetRow][targetCol] = player;
		state.piecesByCell.set(cellKey(targetRow, targetCol), piece);

		if (player === 1) state.stats.p1Moves += 1;
		if (player === 2) state.stats.p2Moves += 1;
		updateStatsUI();
		maybeDeclareWinner();

		if (wasCapture) {
			const furtherCaptures = getAvailableCapturePlans(piece);
			if (furtherCaptures.length > 0) {
				state.activeMultiJumpPiece = piece;
				clearSelection();
				state.selectedPiece = piece;
				state.selectedPiece.material = state.currentPlayer === 1 ? assets.p1Selected : assets.p2Selected;
				setStatus(`Turn: Player ${state.currentPlayer} | Continue capture`);
				updateTurnIndicator();
				isAnimatingMove = false;
				return;
			}
		}

		finishTurn();
		isAnimatingMove = false;
	}

	// Handles pointer interaction: piece selection and destination clicks.
	async function onBoardClick(event) {
		if (isAnimatingMove) return;

		const rect = sceneCtx.renderer.domElement.getBoundingClientRect();
		pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		raycaster.setFromCamera(pointer, sceneCtx.camera);
		const hitPieces = raycaster
			.intersectObjects(sceneCtx.boardGroup.children, true)
			.map((entry) => entry.object)
			.find((obj) => obj.userData && obj.userData.isPiece);

		if (hitPieces) {
			trySelectPiece(hitPieces);
			return;
		}

		if (!state.selectedPiece) return;

		const hitSquares = raycaster.intersectObjects(sceneCtx.darkSquares, false);
		if (hitSquares.length === 0) return;

		const square = hitSquares[0].object;
		const { row, col } = square.userData;
		if (state.boardState[row][col] !== 0) return;

		const movePlan = getMovePlan(state.selectedPiece, row, col);
		if (!movePlan) return;
		if (state.activeMultiJumpPiece && movePlan.type !== 'capture') return;
		if (!state.activeMultiJumpPiece && playerHasCapture(state.currentPlayer) && movePlan.type !== 'capture') {
			setStatus(`Turn: Player ${state.currentPlayer} | Capture is required`);
			return;
		}

		await movePiece(state.selectedPiece, row, col, movePlan);
	}

	// Renders a single frame and advances camera controls with frame delta.
	function renderFrame(nowMs) {
		if (!isRenderActive) return;

		if (lastFrameTimeMs === 0) lastFrameTimeMs = nowMs;
		const deltaSeconds = Math.min((nowMs - lastFrameTimeMs) / 1000, 0.05);
		lastFrameTimeMs = nowMs;

		sceneCtx.controls.update(deltaSeconds);
		sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.camera);
		renderLoopId = requestAnimationFrame(renderFrame);
	}

	// Starts the animation frame loop if it is not already running.
	function startRenderLoop() {
		if (isRenderActive) return;
		isRenderActive = true;
		lastFrameTimeMs = 0;
		renderLoopId = requestAnimationFrame(renderFrame);
	}

	// Stops the animation frame loop to save resources.
	function stopRenderLoop() {
		isRenderActive = false;
		if (renderLoopId !== null) {
			cancelAnimationFrame(renderLoopId);
			renderLoopId = null;
		}
	}

	// Toggles rendering based on tab visibility and window focus.
	function handleVisibilityOrFocusChange() {
		const shouldRender = !document.hidden && document.hasFocus();
		if (shouldRender) {
			startRenderLoop();
		} else {
			stopRenderLoop();
		}
	}

	// Registers game interaction and lifecycle event listeners.
	function bindEvents() {
		sceneCtx.renderer.domElement.addEventListener('click', onBoardClick);
		dom.difficultySelectEl.addEventListener('change', () => {
			state.cpuDifficulty = dom.difficultySelectEl.value;
			setStatus(`Turn: Player ${state.currentPlayer} | CPU: ${state.cpuDifficulty}`);
			updateTurnIndicator();
		});
		dom.resetButtonEl.addEventListener('click', resetGame);

		document.addEventListener('visibilitychange', handleVisibilityOrFocusChange);
		window.addEventListener('blur', handleVisibilityOrFocusChange);
		window.addEventListener('focus', handleVisibilityOrFocusChange);
	}

	// Initializes UI state and starts the controller lifecycle.
	function start() {
		syncHudAfterReset();
		bindEvents();
		handleVisibilityOrFocusChange();
	}

	return { start };
}
