import { Chess } from 'chess.js'

export function createGame(fen) {
	try { return fen ? new Chess(fen) : new Chess() } catch { return new Chess() }
}
export function playMove(game, sourceSquare, targetSquare) { try { return game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' }) } catch { return null } }