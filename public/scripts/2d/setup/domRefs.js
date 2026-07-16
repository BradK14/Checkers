export function getGameDomRefs() {
  return {
    boardElement: document.getElementById('board'),
    // Blueprint: Uncomment these references if you enable toolbar loading UI.
    // Step A: Grab toolbar container to toggle loading class.
    // Step B: Grab spinner element to control aria-hidden.
    // toolbarElement: document.querySelector('.game-toolbar'),
    // cpuLoadingIndicator: document.getElementById('cpu-loading-indicator'),
    tilesElement: document.querySelector('div.tiles'),
    player1PiecesContainer: document.querySelector('.player1pieces'),
    player2PiecesContainer: document.querySelector('.player2pieces'),
    turnElement: document.querySelector('.turn'),
    winnerElement: document.getElementById('winner'),
    player1Element: document.getElementById('player1'),
    player2Element: document.getElementById('player2'),
    clearButton: document.getElementById('cleargame'),
    cpuToggle: document.getElementById('cpu-toggle'),
    cpuDifficultySelect: document.getElementById('cpu-difficulty-select'),
    animationToggle: document.getElementById('animation-toggle'),
    saveButton: document.getElementById('savegame'),
    resumeButton: document.getElementById('resumegame'),
    saveStatus: document.getElementById('save-status')
  };
}
