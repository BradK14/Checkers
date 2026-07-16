// Pick one random item from a list.
function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Give one move a heuristic score so stronger-looking moves rank higher.
function scoreMove(move) {
  let score = 0;
  if (move.type === 'jump') score += 100;
  if (move.piece && move.piece.king) score += 15;

  if (move.piece && !move.piece.king && move.target && move.target.row === 0) {
    score += 60;
  }

  const row = move.target ? move.target.row : 0;
  const col = move.target ? move.target.col : 0;
  score += (3.5 - Math.abs(row - 3.5)) * 2;
  score += (3.5 - Math.abs(col - 3.5)) * 2;

  if (move.piece && !move.piece.king) {
    score += (move.piece.row - row) * 4;
  }

  return score;
}

// Hard heuristic CPU: score all legal moves and choose from the best-scoring options.
export function chooseHardHeuristicMove(legalMoves) {
  if (!Array.isArray(legalMoves) || legalMoves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMoves = [];
  for (const move of legalMoves) {
    const moveScore = scoreMove(move);
    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMoves = [move];
    } else if (moveScore === bestScore) {
      bestMoves.push(move);
    }
  }

  if (bestMoves.length === 0) return null;
  const selected = randomChoice(bestMoves);
  return Number.isInteger(selected.moveId) ? selected.moveId : null;
}
