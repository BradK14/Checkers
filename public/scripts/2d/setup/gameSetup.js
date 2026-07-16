import { getGameDomRefs } from './domRefs.js';
import { createBoardController } from '../logic/boardLogic.js';

export function initializeGame() {
    const dom = getGameDomRefs();
    const game = createBoardController(dom);
    const Board = game.board;
    const pieces = game.pieces;
    const tiles = game.tiles;

    // Blueprint order for implementation:
    // Step 1: Implement setSaveStatus.
    // Step 2: Implement persistState.
    // Step 3: Implement fetchSavedState.
    // Step 4: Implement syncPlayModeControls.
    // Step 5: Implement syncControlsFromBoardState.
    // Step 6: Implement CPU-related control listeners.
    // Step 7: Implement save button flow.
    // Step 8: Implement resume button flow.
    // Step 9: Implement reset flow.
    // Step 10: Implement tile click move flow.

    function clearSelectedPieces() {
      document.querySelectorAll('.piece').forEach(function (pieceEl) {
        pieceEl.classList.remove('selected');
      });
    }

    game.setClearSelectedPiecesHandler(clearSelectedPieces);

    function setSaveStatus(message, isError) {
      if (!dom.saveStatus) return;
      // Step 1.1: Set status text for save/resume actions.
      // Step 1.2: Use error color when isError is true, otherwise use normal status color.
    }

    async function persistState(state) {
      // Step 2.1: POST { state } to /api/checkers/2d/save.
      // Step 2.2: Throw if response is not OK.
      // Step 2.3: Return parsed JSON payload from the save API.
      return null;
    }

    async function fetchSavedState() {
      // Step 3.1: GET /api/checkers/2d/save.
      // Step 3.2: Return null for 404 (no save exists).
      // Step 3.3: Throw for other non-OK responses.
      // Step 3.4: Return payload.state if present.
      return null;
    }

    function syncPlayModeControls() {
      const twoPlayerMode = dom.cpuToggle ? dom.cpuToggle.checked : false;
      // Step 4.1: Map toggle value to Board.cpuEnabled.
      if (dom.cpuDifficultySelect) {
        // Step 4.2: Disable difficulty selector when two-player mode is enabled.
      }
    }

    function syncControlsFromBoardState() {
      if (dom.cpuToggle) {
        // Step 5.1: Reflect Board.cpuEnabled in the CPU toggle UI.
      }
      if (dom.cpuDifficultySelect) {
        // Step 5.2: Reflect Board.cpuDifficulty and enabled/disabled state in dropdown.
      }
      if (dom.animationToggle) {
        // Step 5.3: Reflect Board.showCpuAnimation in animation toggle UI.
      }
    }

    Board.initalize();
    Board.check_if_jump_exist();
    Board.updateTurnIndicator();

    if (dom.cpuToggle) {
      // Step 6.1: Initialize CPU/two-player controls from current UI state.
      dom.cpuToggle.addEventListener('change', function () {
        // Step 6.2: Resync CPU/two-player settings.
        // Step 6.3: If CPU is enabled and it is CPU turn, queue a CPU move.
      });
    }

    if (dom.cpuDifficultySelect) {
      // Step 6.4: Initialize dropdown from Board.cpuDifficulty.
      dom.cpuDifficultySelect.addEventListener('change', function (event) {
        // Step 6.5: Update Board.cpuDifficulty from selected value.
        // Step 6.6: If it is CPU turn, schedule move using the new difficulty.
      });
    }

    if (dom.animationToggle) {
      // Step 6.7: Initialize animation flag from checkbox state.
      dom.animationToggle.addEventListener('change', function (event) {
        // Step 6.8: Update Board.showCpuAnimation from checkbox state.
      });
    }

    if (dom.saveButton) {
      dom.saveButton.addEventListener('click', async function () {
        // Step 7.1: Build serializable board state and persist it via API.
        // Step 7.2: Show success status with saved timestamp.
        // Step 7.3: Handle errors and show an error status message.
      });
    }

    if (dom.resumeButton) {
      dom.resumeButton.addEventListener('click', async function () {
        // Step 8.1: Load saved state from API.
        // Step 8.2: Validate and apply loaded state to the board.
        // Step 8.3: Sync controls after restore and show status message.
        // Step 8.4: Handle errors and show an error status message.
      });
    }

    if (dom.clearButton) {
      dom.clearButton.addEventListener('click', function () {
        // Step 9.1: Reset the board to initial game state.
      });
    }

    document.addEventListener('click', function (event) {
      const pieceEl = event.target.closest('.piece');
      if (!pieceEl) return;

      if (Board.cpuEnabled && Board.playerTurn == 2) return;

      let selected = false;
      const parentClass = pieceEl.parentElement.className.split(' ')[0];
      const isPlayersTurn = parentClass == 'player' + Board.playerTurn + 'pieces';
      if (isPlayersTurn) {
        if (!Board.continuousjump && pieces[pieceEl.id].allowedtomove) {
          if (pieceEl.classList.contains('selected')) selected = true;
          clearSelectedPieces();
          if (!selected) {
            pieceEl.classList.add('selected');
          }
        } else {
          const exist = 'jump exist for other pieces, that piece is not allowed to move';
          const continuous = 'continuous jump exist, you have to jump the same piece';
          const message = !Board.continuousjump ? exist : continuous;
          console.log(message);
        }
      }
    });

    document.addEventListener('click', function (event) {
      /*
      Step 10.1: Ignore non-tile clicks.
      Step 10.2: Ignore input when CPU controls current turn.
      Step 10.3: Read currently selected piece.
      Step 10.4: Resolve tile + piece objects and validate move range.
      Step 10.5: Handle jump moves and chained jumps.
      Step 10.6: Handle regular moves when jumps are not forced.
      Step 10.7: Switch turns after successful move.
      */
    });

}
