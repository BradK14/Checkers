// Collects and validates required DOM nodes for the 3D game UI.
export function getGameDomRefs() {
	const canvasHost = document.getElementById('checkers3d-canvas');
	const statusEl = document.getElementById('checkers3d-status');
	const winnerEl = document.getElementById('checkers3d-winner');
	const p1CapturedEl = document.getElementById('p1-captured');
	const p2CapturedEl = document.getElementById('p2-captured');
	const p1MovesEl = document.getElementById('p1-moves');
	const p2MovesEl = document.getElementById('p2-moves');
	const difficultySelectEl = document.getElementById('difficulty-select');
	const resetButtonEl = document.getElementById('checkers3d-reset');
	const turnEl = document.querySelector('.stats-card .turn');

	if (!canvasHost || !statusEl || !winnerEl || !p1CapturedEl || !p2CapturedEl || !p1MovesEl || !p2MovesEl || !difficultySelectEl || !resetButtonEl || !turnEl) {
		throw new Error('Missing 3D checkers DOM nodes.');
	}

	return {
		canvasHost,
		statusEl,
		winnerEl,
		p1CapturedEl,
		p2CapturedEl,
		p1MovesEl,
		p2MovesEl,
		difficultySelectEl,
		resetButtonEl,
		turnEl
	};
}
