import { Chessboard } from 'react-chessboard'

function ChessBoard({
  position,
  onPieceDrop,
  theme = { light: '#f7f5ef', dark: '#172033', frame: '#172033' },
  orientation = 'white',
  showNotation = true,
  animationDuration = 250,
}) {
  return <div className="board-frame" style={{ backgroundColor: theme.frame }}><Chessboard options={{ position, onPieceDrop, boardOrientation: orientation, allowDragging: true, showNotation, animationDurationInMs: animationDuration, boardStyle: { borderRadius: 0 }, darkSquareStyle: { backgroundColor: theme.dark }, lightSquareStyle: { backgroundColor: theme.light } }} /></div>
}

export default ChessBoard