const links = ['HOME', 'PLAY', 'NEWS', 'RULES', 'STYLE', 'SETTINGS']

function Header() {
  return <header className="site-header"><div className="brand-row"><span className="brand-mark" aria-hidden="true">♞</span><a className="brand-name" href="#top">Neural Knight</a></div><div className="header-rule" /><nav aria-label="Primary navigation"><ul className="nav-list">{links.map((link) => <li key={link}><a className={`nav-link ${link === 'PLAY' ? 'active' : ''}`} href={link === 'PLAY' ? '#play' : `#${link.toLowerCase()}`}>{link}</a></li>)}</ul></nav></header>
}

export default Header