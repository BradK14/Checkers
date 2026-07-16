// Pick one random item from a list.
function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Easy mode CPU: choose any legal move at random.
export function chooseEasyMove(legalMoves) {
  if (!Array.isArray(legalMoves) || legalMoves.length === 0) return null;
  const selected = randomChoice(legalMoves);
  return Number.isInteger(selected.moveId) ? selected.moveId : null;
}
