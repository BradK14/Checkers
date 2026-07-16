import { chooseEasyMove } from './easyMove.js';
import { chooseHardHeuristicMove } from './hardHeuristicMove.js';
import { chooseGeminiMove } from './geminiMove.js';

// Main CPU router: choose easy heuristic, Gemini hard mode, or heuristic fallback.
export async function resolveCpuMove({ state, legalMoves, difficulty, apiKey }) {
  const mode = difficulty === 'hard' ? 'hard' : 'easy';

  if (mode === 'easy') {
    const moveId = chooseEasyMove(legalMoves);
    console.debug('[CPU_MOVES] mode=easy provider=easy-heuristic fallback=false moveId=%s', moveId);
    return {
      moveId,
      provider: 'easy-heuristic',
      fallback: false
    };
  }

  try {
    const move = await chooseGeminiMove({ state, legalMoves, apiKey });
    if (!move || !Array.isArray(move.from) || !Array.isArray(move.to)) {
      throw new Error('Gemini did not return a valid move object.');
    }
    console.debug('[CPU_MOVES] mode=hard provider=gemini fallback=false from=%o to=%o', move.from, move.to);
    return {
      move,
      provider: 'gemini',
      fallback: false
    };
  } catch (error) {
    console.warn('[CPU_MOVES] mode=hard provider=hard-heuristic fallback=true reason=%s', error && error.message ? error.message : String(error));
    const fallbackMoveId = chooseHardHeuristicMove(legalMoves);
    console.debug('[CPU_MOVES] mode=hard provider=hard-heuristic fallback=true moveId=%s', fallbackMoveId);
    return {
      moveId: fallbackMoveId,
      provider: 'hard-heuristic',
      fallback: true
    };
  }
}
