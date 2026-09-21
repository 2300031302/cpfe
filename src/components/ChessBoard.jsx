import { Chessboard } from 'react-chessboard'

function ChessBoard({ position, onPieceDrop }) {
  return <div className="board-frame"><Chessboard options={{ position, onPieceDrop, boardOrientation: 'white', allowDragging: true, boardStyle: { borderRadius: 0 }, darkSquareStyle: { backgroundColor: '#172033' }, lightSquareStyle: { backgroundColor: '#f7f5ef' } }} /></div>
}

export default ChessBoard