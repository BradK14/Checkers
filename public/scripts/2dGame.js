import { initializeGame } from './2d/setup/gameSetup.js';

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('load', function () {
    initializeGame();
  });
}
