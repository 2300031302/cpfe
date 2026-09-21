export function mockAccuracy(move) {
  if (!move) return { lastMove: '—', score: 0, evaluation: 'Awaiting move', suggestion: 'Make a move to receive practice feedback.' }
  const centralSquares = ['d4', 'e4', 'd5', 'e5', 'c4', 'f4', 'c5', 'f5']
  const score = centralSquares.includes(move.to) ? 94 : 88
  return { lastMove: move.san, score, evaluation: score > 90 ? 'Good move' : 'Sound move', suggestion: score > 90 ? 'A purposeful choice. Keep developing with tempo and control.' : 'Look for a chance to develop a piece toward the center.' }
}