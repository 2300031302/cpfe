import { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChessBoard from '../components/ChessBoard'
import MoveHistory from '../components/MoveHistory'
import MoveAccuracy from '../components/MoveAccuracy'
import LearnChess from '../components/LearnChess'
import { createGame, playMove } from '../chess/chessGame'
import { evaluateMove } from '../services/chessEngine'
import { videos } from '../data/videos'
import '../App.css'

const SESSION_KEY = 'neural-knight-game'

function loadSession() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function saveSession(state) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)) } catch { /* Storage can be unavailable in private browsing. */ }
}

function Home() {
  const [savedSession] = useState(loadSession)
  const [game, setGame] = useState(() => createGame(savedSession?.fen))
  const [position, setPosition] = useState(game.fen())
  const [moves, setMoves] = useState(savedSession?.moves || [])
  const [status, setStatus] = useState(savedSession?.status || { message: 'White to move', tone: 'neutral' })
  const [accuracy, setAccuracy] = useState(savedSession?.accuracy || evaluateMove(null))
  function handleMove({ sourceSquare, targetSquare }) {
    const nextGame = new (game.constructor)(game.fen())
    const move = playMove(nextGame, sourceSquare, targetSquare)
    if (!move) {
      const illegalStatus = { message: 'Illegal move', tone: 'illegal' }
      setStatus(illegalStatus)
      saveSession({ fen: game.fen(), moves, accuracy, status: illegalStatus })
      return false
    }
    const nextMoves = [...moves, move.san]
    const nextAccuracy = evaluateMove(move)
    const nextStatus = { message: `Legal move: ${move.san} · ${nextGame.isGameOver() ? 'Game over' : `${nextGame.turn() === 'w' ? 'White' : 'Black'} to move`}`, tone: 'legal' }
    setGame(nextGame); setPosition(nextGame.fen()); setMoves(nextMoves); setAccuracy(nextAccuracy); setStatus(nextStatus)
    saveSession({ fen: nextGame.fen(), moves: nextMoves, accuracy: nextAccuracy, status: nextStatus })
    return true
  }
  function resetGame() { sessionStorage.removeItem(SESSION_KEY); const freshGame = createGame(); setGame(freshGame); setPosition(freshGame.fen()); setMoves([]); setAccuracy(evaluateMove(null)); setStatus({ message: 'White to move', tone: 'neutral' }) }
  return <div className="site-shell" id="top"><Header /><main className="container"><section className="hero-intro" id="home"><div><div className="eyebrow">The thoughtful chess studio</div><h1 className="hero-title">Play with more<br />intention.</h1></div><p className="hero-copy">A quiet place to practice, review your choices, and keep finding a clearer path across the board.</p></section><section className="play-layout" id="play"><div className="board-wrap"><div className="section-label">Live board</div><ChessBoard position={position} onPieceDrop={handleMove} /><div className="board-footer"><span className={`status-line status-${status.tone}`}>Status: <strong>{status.message}</strong></span><button className="reset-button" type="button" onClick={resetGame}>Reset game</button></div></div><aside className="game-sidebar"><div className="sidebar-block"><h3 className="sidebar-heading">Current game</h3><div className="latest-move"><span>Latest move</span><strong>{accuracy.lastMove}</strong></div></div><MoveHistory moves={moves} /><div className="sidebar-block"><h3 className="sidebar-heading">Practice note</h3><p className="capture-note">Play as White and explore the position at your own pace. Legal moves are accepted automatically.</p></div></aside></section><MoveAccuracy accuracy={accuracy} /><LearnChess videos={videos} /></main><Footer /></div>
}

export default Home