import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChessBoard from '../components/ChessBoard'
import MoveHistory from '../components/MoveHistory'
import MoveAccuracy from '../components/MoveAccuracy'
import LearnChess from '../components/LearnChess'
import { createGame, playMove } from '../chess/chessGame'
import { evaluateMove } from '../services/chessEngine'
import { analyzePosition, checkBackend, getRemoteGame, predictRemoteMove, submitRemoteMove } from '../services/chessApi'
import { videos } from '../data/videos'
import '../App.css'

const SESSION_KEY = 'neural-knight-game'
const BOARD_STYLES = [
  { id: 'midnight', name: 'Midnight', detail: 'Ink and ivory', light: '#f7f5ef', dark: '#172033', frame: '#172033' },
  { id: 'woodland', name: 'Woodland', detail: 'Moss and linen', light: '#e8e2cf', dark: '#55745d', frame: '#243c32' },
  { id: 'clay', name: 'Terracotta', detail: 'Warm and earthy', light: '#f2dfc9', dark: '#b46e51', frame: '#603f35' },
  { id: 'ocean', name: 'Deep ocean', detail: 'Mist and tide', light: '#dce8e7', dark: '#467480', frame: '#203d49' },
]
const PIECE_RULES = [
  { symbol: '♙', name: 'Pawn', rule: 'Moves forward one square, or two from its starting square if both squares are clear. Captures one square diagonally forward.' },
  { symbol: '♖', name: 'Rook', rule: 'Slides any number of squares horizontally or vertically, as long as its path is clear.' },
  { symbol: '♘', name: 'Knight', rule: 'Moves in an L shape: two squares in one direction, then one to the side. It can jump over pieces.' },
  { symbol: '♗', name: 'Bishop', rule: 'Slides any number of squares diagonally, as long as its path is clear.' },
  { symbol: '♕', name: 'Queen', rule: 'Combines the rook and bishop: it slides any distance horizontally, vertically, or diagonally.' },
  { symbol: '♔', name: 'King', rule: 'Moves one square in any direction. It may not move into check or next to the opposing king.' },
]

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
  const [activePage, setActivePage] = useState('play')
  const [boardStyle, setBoardStyle] = useState(BOARD_STYLES[0])
  const [orientation, setOrientation] = useState('white')
  const [showNotation, setShowNotation] = useState(true)
  const [animationDuration, setAnimationDuration] = useState(250)
  const [savedSession] = useState(loadSession)
  const [game, setGame] = useState(() => createGame(savedSession?.fen))
  const [position, setPosition] = useState(game.fen())
  const [backendConfig] = useState(() => ({ initialFen: savedSession?.fen || game.fen(), gameId: savedSession?.gameId || null }))
  const [moves, setMoves] = useState(savedSession?.moves || [])
  const [status, setStatus] = useState(savedSession?.status || { message: 'White to move', tone: 'neutral' })
  const [accuracy, setAccuracy] = useState(savedSession?.accuracy || evaluateMove(null))
  const [backendState, setBackendState] = useState({ available: false, gameId: savedSession?.gameId || null, prediction: null })

  useEffect(() => {
    let active = true
    async function connectBackend() {
      try {
        await checkBackend()
        const analysis = await analyzePosition(backendConfig.initialFen)
        const prediction = analysis.recommended_move ? {
          move: analysis.recommended_move,
          confidence: analysis.confidence,
          explanation: analysis.explanation,
        } : null
        if (active) setBackendState({ available: true, gameId: null, prediction })
      } catch {
        if (active) setBackendState((current) => ({ ...current, available: false }))
      }
    }
    connectBackend()
    return () => { active = false }
  }, [backendConfig])

  async function handleMove({ sourceSquare, targetSquare }) {
    const movingPiece = game.get(sourceSquare)
    const isPromotion = movingPiece?.type === 'p' && ['1', '8'].includes(targetSquare[1])
    const submittedMove = `${sourceSquare}${targetSquare}${isPromotion ? 'q' : ''}`
    let analyzedPrediction = backendState.prediction
    if (backendState.available) {
      try {
        const analysis = await analyzePosition(game.fen(), submittedMove)
        if (!analysis.legal) {
          const illegalStatus = { message: analysis.message || 'Illegal move', tone: 'illegal' }
          setStatus(illegalStatus)
          return false
        }
        analyzedPrediction = {
          move: analysis.recommended_move,
          confidence: analysis.confidence,
          explanation: analysis.explanation,
        }
        setBackendState((current) => ({ ...current, prediction: analyzedPrediction }))
      } catch {
        setBackendState((current) => ({ ...current, available: false }))
      }
    }
    const nextGame = new (game.constructor)(game.fen())
    const move = playMove(nextGame, sourceSquare, targetSquare)
    if (!move) {
      const illegalStatus = { message: 'Illegal move', tone: 'illegal' }
      setStatus(illegalStatus)
      saveSession({ fen: game.fen(), moves, accuracy, status: illegalStatus })
      return false
    }
    let displayedGame = nextGame
    let backendPrediction = analyzedPrediction
    let backendMessage = ''
    let nextAccuracy = evaluateMove(move)
    const predictedMove = analyzedPrediction?.move
    const submittedUciMove = `${sourceSquare}${targetSquare}${move.promotion || ''}`
    if (backendState.available && backendState.gameId) {
      try {
        const remoteMove = await submitRemoteMove(backendState.gameId, submittedUciMove)
        const remoteGame = await getRemoteGame(backendState.gameId)
        if (remoteGame.fen || remoteMove.fen) displayedGame = createGame(remoteGame.fen || remoteMove.fen)
        backendMessage = remoteMove.ai_move ? ` · Engine reply: ${remoteMove.ai_move}` : ''
        backendPrediction = await predictRemoteMove(backendState.gameId)
        const isRecommended = predictedMove === submittedUciMove
        const backendAccuracy = {
          lastMove: move.san,
          score: isRecommended ? Math.round((remoteMove.confidence || 1) * 100) : 55,
          evaluation: isRecommended ? 'Right move' : 'Try the suggested move',
          suggestion: isRecommended ? (remoteMove.explanation || 'This matches the engine recommendation.') : `The engine suggested ${predictedMove || 'a different move'}.`,
        }
        nextAccuracy = backendAccuracy
      } catch {
        setBackendState((current) => ({ ...current, available: false }))
      }
    }
    const nextMoves = [...moves, move.san]
    if (displayedGame !== nextGame && backendMessage) nextMoves.push(backendMessage.replace(' · Engine reply: ', ''))
    const nextStatus = { message: `Legal move: ${move.san}${backendMessage} · ${displayedGame.isGameOver() ? 'Game over' : `${displayedGame.turn() === 'w' ? 'White' : 'Black'} to move`}`, tone: 'legal' }
    setGame(displayedGame); setPosition(displayedGame.fen()); setMoves(nextMoves); setAccuracy(nextAccuracy); setStatus(nextStatus); setBackendState((current) => ({ ...current, prediction: backendPrediction }))
    saveSession({ fen: displayedGame.fen(), moves: nextMoves, accuracy: nextAccuracy, status: nextStatus, gameId: backendState.gameId })
    return true
  }
  async function resetGame() {
    sessionStorage.removeItem(SESSION_KEY)
    const freshGame = createGame()
    setGame(freshGame); setPosition(freshGame.fen()); setMoves([]); setAccuracy(evaluateMove(null)); setStatus({ message: 'White to move', tone: 'neutral' })
    if (backendState.available) {
      try {
        const analysis = await analyzePosition(freshGame.fen())
        setBackendState((current) => ({
          ...current,
          prediction: analysis.recommended_move ? {
            move: analysis.recommended_move,
            confidence: analysis.confidence,
            explanation: analysis.explanation,
          } : null,
        }))
        return
      } catch {
        setBackendState((current) => ({ ...current, available: false, prediction: null }))
      }
    }
    setBackendState((current) => ({ ...current, prediction: null }))
  }
  function navigateTo(page) {
    setActivePage(page)
    if (page === 'news') {
      window.setTimeout(() => {
        const newsSection = document.getElementById('news')
        if (newsSection) {
          window.scrollTo({
            top: newsSection.getBoundingClientRect().top + window.scrollY,
            behavior: 'smooth',
          })
        }
      }, 0)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  const pageTitles = {
    rules: { eyebrow: 'A quick field guide', title: 'Know your pieces.', copy: 'Every piece has its own rhythm. Learn how they move, then bring them together.' },
    style: { eyebrow: 'Make the board yours', title: 'A board to suit you.', copy: 'Choose a palette for your next game. Your selection updates the live board straight away.' },
    settings: { eyebrow: 'Your playing experience', title: 'Set your preferences.', copy: 'Fine-tune the board and choose how it feels to play.' },
  }
  const currentPage = pageTitles[activePage]
  return <div className="site-shell" id="top"><Header activePage={activePage} onNavigate={navigateTo} /><main className="container">{currentPage ? <><section className="hero-intro page-intro"><div><div className="eyebrow">{currentPage.eyebrow}</div><h1 className="hero-title">{currentPage.title}</h1></div><p className="hero-copy">{currentPage.copy}</p></section>{activePage === 'rules' && <section className="info-page rules-page" aria-label="Chess rules"><div className="piece-grid">{PIECE_RULES.map((piece) => <article className="piece-card" key={piece.name}><div className="piece-symbol" aria-hidden="true">{piece.symbol}</div><div><h2>{piece.name}</h2><p>{piece.rule}</p></div></article>)}</div><div className="rule-notes"><article><span className="eyebrow">The aim</span><h2>Checkmate the king</h2><p>Attack the opposing king so it cannot escape, block the attack, or capture the attacking piece. The game ends in checkmate.</p></article><article><span className="eyebrow">Special moves</span><h2>Three exceptions to know</h2><p><strong>Castling</strong> moves the king two squares toward a rook and brings that rook beside it. It is only allowed if neither piece has moved, the squares between them are clear, the king is not in check, and it does not cross or land on an attacked square. <strong>En passant</strong> is a special pawn capture available immediately after an enemy pawn advances two squares past yours. <strong>Promotion</strong> turns a pawn that reaches the far edge into a queen, rook, bishop, or knight.</p></article><article><span className="eyebrow">A drawn game</span><h2>When neither side wins</h2><p>A game can be drawn by stalemate (the player to move has no legal move but is not in check), agreement, or other official draw conditions such as threefold repetition or the fifty-move rule.</p></article></div></section>}{activePage === 'style' && <section className="info-page style-page" aria-label="Board styles"><div className="style-grid">{BOARD_STYLES.map((style) => <button className={`style-card ${boardStyle.id === style.id ? 'selected' : ''}`} type="button" key={style.id} onClick={() => setBoardStyle(style)} aria-pressed={boardStyle.id === style.id}><span className="style-preview" aria-hidden="true"><span style={{ backgroundColor: style.light }} /><span style={{ backgroundColor: style.dark }} /><span style={{ backgroundColor: style.dark }} /><span style={{ backgroundColor: style.light }} /></span><span className="style-card-copy"><strong>{style.name}</strong><small>{style.detail}</small></span><span className="style-check" aria-hidden="true">{boardStyle.id === style.id ? '✓' : '+'}</span></button>)}</div><div className="style-current"><span className="eyebrow">Selected palette</span><strong>{boardStyle.name}</strong><div className="style-mini-board" aria-label={`${boardStyle.name} board preview`}>{Array.from({ length: 16 }, (_, index) => <span key={index} style={{ backgroundColor: ((Math.floor(index / 4) + index % 4) % 2) ? boardStyle.dark : boardStyle.light }} />)}</div><button className="reset-button" type="button" onClick={() => navigateTo('play')}>Try it on the board</button></div></section>}{activePage === 'settings' && <section className="info-page settings-page" aria-label="Game settings"><div className="settings-list"><label className="setting-row"><span><strong>Show board coordinates</strong><small>Display file and rank labels around the board.</small></span><input type="checkbox" checked={showNotation} onChange={(event) => setShowNotation(event.target.checked)} /></label><label className="setting-row"><span><strong>Flip the board</strong><small>Switch the playing side to view from Black’s perspective.</small></span><input type="checkbox" checked={orientation === 'black'} onChange={(event) => setOrientation(event.target.checked ? 'black' : 'white')} /></label><label className="setting-row"><span><strong>Smooth piece movement</strong><small>Animate pieces as they move across the board.</small></span><input type="checkbox" checked={animationDuration > 0} onChange={(event) => setAnimationDuration(event.target.checked ? 250 : 0)} /></label></div><div className="settings-preview"><span className="eyebrow">Live preview</span><ChessBoard position={position} onPieceDrop={handleMove} theme={boardStyle} orientation={orientation} showNotation={showNotation} animationDuration={animationDuration} /><p>Settings apply immediately to the live board.</p></div></section>}</> : <><section className="hero-intro" id="home"><div><div className="eyebrow">The thoughtful chess studio</div><h1 className="hero-title">Play with more<br />intention.</h1></div><p className="hero-copy">A quiet place to practice, review your choices, and keep finding a clearer path across the board.</p></section><section className="play-layout" id="play"><div className="board-wrap"><div className="section-label">Live board</div><ChessBoard position={position} onPieceDrop={handleMove} theme={boardStyle} orientation={orientation} showNotation={showNotation} animationDuration={animationDuration} /><div className="board-footer"><span className={`status-line status-${status.tone}`}>Status: <strong>{status.message}</strong></span><button className="reset-button" type="button" onClick={resetGame}>Reset game</button></div></div><aside className="game-sidebar"><div className="sidebar-block"><h3 className="sidebar-heading">Current game</h3><div className="latest-move"><span>Latest move</span><strong>{accuracy.lastMove}</strong></div>{backendState.prediction && <><div className="latest-move"><span>AI recommendation</span><strong>{backendState.prediction.move}</strong></div><div className="analysis-note"><span>Confidence</span><strong>{Math.round((backendState.prediction.confidence || 0) * 100)}%</strong></div></>}</div><MoveHistory moves={moves} /><div className="sidebar-block"><h3 className="sidebar-heading">Practice note</h3><p className="capture-note">Play as White and explore the position at your own pace. Legal moves are accepted automatically.</p></div></aside></section><MoveAccuracy accuracy={accuracy} /><LearnChess videos={videos} /></>}</main><Footer onNavigate={navigateTo} /><div className="sr-only" aria-live="polite">{activePage === 'play' ? status.message : `${activePage} view`}</div></div>
}

export default Home