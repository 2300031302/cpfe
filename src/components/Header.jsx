const links = [
  { label: 'HOME', page: 'home' },
  { label: 'PLAY', page: 'play' },
  { label: 'NEWS', page: 'news' },
  { label: 'RULES', page: 'rules' },
  { label: 'STYLE', page: 'style' },
  { label: 'SETTINGS', page: 'settings' },
]

function Header({ activePage, onNavigate }) {
  return <header className="site-header"><div className="brand-row"><span className="brand-mark" aria-hidden="true">♞</span><button className="brand-name" type="button" onClick={() => onNavigate('home')}>Neural Knight</button></div><div className="header-rule" /><nav aria-label="Primary navigation"><ul className="nav-list">{links.map(({ label, page }) => <li key={page}><button className={`nav-link ${activePage === page ? 'active' : ''}`} type="button" aria-current={activePage === page ? 'page' : undefined} onClick={() => onNavigate(page)}>{label}</button></li>)}</ul></nav></header>
}

export default Header