function MoveHistory({ moves }) {
  const rows = []
  for (let index = 0; index < moves.length; index += 2) rows.push({ number: Math.floor(index / 2) + 1, white: moves[index], black: moves[index + 1] })
  return <div className="sidebar-block"><h3 className="sidebar-heading">Move history</h3>{rows.length === 0 ? <p className="empty-history">Your played moves will appear here.</p> : <ol className="move-list">{rows.map((row) => <li className="move-row" key={row.number}><span className="move-number">{row.number}.</span><span>{row.white}</span><span>{row.black || '—'}</span></li>)}</ol>}</div>
}

export default MoveHistory