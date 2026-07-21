import { getGameDomRefs } from './domRefs.js';
import { createBoardController } from '../logic/boardLogic.js';

export function initializeGame() {
    const dom = getGameDomRefs();
    const game = createBoardController(dom);
    const Board = game.board;
    const pieces = game.pieces;
    const tiles = game.tiles;

    // Blueprint order for implementation:
    // DONE Step 1: Implement setSaveStatus.
    // DONE Step 2: Implement persistState.
    // Step 3: Implement fetchSavedState.
    // DONE Step 4: Implement syncPlayModeControls.
    // DONE Step 5: Implement syncControlsFromBoardState.
    // Step 6: Implement CPU-related control listeners.
    // DONE Step 7: Implement save button flow.
    // Step 8: Implement resume button flow.
    // DONE Step 9: Implement reset flow.
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
      dom.saveStatus.textContent = message;
      // Step 1.2: Use error color when isError is true, otherwise use normal status color.
      if (isError){
        dom.saveStatus.style.color = `rgb(255, 0, 0)`;
      }
      else{
        dom.saveStatus.style.color = `rgb(0, 255, 0)`;
      }
    }

    async function persistState(state) {
      // Step 2.1: POST { state } to /api/checkers/2d/save.
        const response = await fetch("/api/checkers/2d/save", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({state: state})
        });
      // Step 2.2: Throw if response is not OK.
      if(!response.ok){
        throw new Error(`${response.status} failed to save`);
      }
      // Step 2.3: Return parsed JSON payload from the save API.
      return response.json();
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
      Board.cpuEnabled = !twoPlayerMode;
      if (dom.cpuDifficultySelect) {
        // Step 4.2: Disable difficulty selector when two-player mode is enabled.
        dom.cpuDifficultySelect.disabled = twoPlayerMode;
      }
    }

    function syncControlsFromBoardState() {
      if (dom.cpuToggle) {
        // Step 5.1: Reflect Board.cpuEnabled in the CPU toggle UI.
        Board.cpuToggle.checked = !Board.cpuEnabled;
      }
      if (dom.cpuDifficultySelect) {
        // Step 5.2: Reflect Board.cpuDifficulty and enabled/disabled state in dropdown.
        dom.cpuDifficultySelect.value = Board.cpuDifficulty;
        dom.cpuDifficultySelect.disabled = !Board.cpuEnabled;
      }
      if (dom.animationToggle) {
        // Step 5.3: Reflect Board.showCpuAnimation in animation toggle UI.
        dom.animationToggle.checked = Board.showCpuAnimation;
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
        try{
          const response = await persistState(Board.buildSerializableState());
          const message = `${response.message} ${response.date}`;
          // Step 7.2: Show success status with saved timestamp.
          setSaveStatus(message, response.state === null);
        }
        catch(error){
          // Step 7.3: Handle errors and show an error status message.
          setSaveStatus("Failed to save", true);
        }
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
        Board.clear();
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
      // Step 10.1: Ignore non-tile clicks.
      const tileEl = event.target.closest('.tile');
      if (!tileEl) { return; }
      const tile = tiles[tileEl.id.replace(/tile/, '')];
      // Step 10.2: Ignore input when CPU controls current turn.
      if (Board.cpuEnabled && Board.playerTurn === 2) { return; }
      // Step 10.3: Read currently selected piece.
      const selectedPiece = document.getElementsByClassName('selected')[0];
      if (!selectedPiece) { return; }
      const piece = pieces[selectedPiece.id];
      // Step 10.4: Resolve tile + piece objects and validate move range.
      const jumpOnly = Board.jumpexist;
      const legalTiles = Board.getLegalMovesForPiece(piece, jumpOnly);
      // const moveType = tileEl.inRange(selectedPiece);
      let legal = false;
      for (let ti of legalTiles){
        if (tile === ti.tile){
          legal = true;
          break;
        }
      }
      // Step 10.5: Handle jump moves and chained jumps.
      if (legal){
      // if (moveType !== 'wrong'){
      //   if (jumpOnly && moveType === 'jump'){
      //     selectedPiece.opponentJump(tileEl);
      //   }
        // Step 10.6: Handle regular moves when jumps are not forced.
        piece.move(tile);
        // Step 10.7: Switch turns after successful move.
        if (jumpOnly){
          const nextSpotTiles = Board.getLegalMovesForPiece(piece, jumpOnly);
          let moreJumps = false;
          for (let ti of nextSpotTiles){
            if (ti.type === 'jump'){
              moreJumps = true;
            }
          }
          if (moreJumps) {
            Board.changePlayerTurn();
          }
          else{
            Board.continuousjump = true;
          }
        }
        else{
          Board.changePlayerTurn();
        }
      }
    });

}
