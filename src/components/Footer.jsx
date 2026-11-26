function Footer({ onNavigate }) {
  return <footer className="site-footer"><div className="container footer-inner"><span className="footer-brand">Neural Knight</span><span className="footer-tagline">Learn. Play. Improve.</span><nav className="footer-links" aria-label="Footer navigation">{[['Home', 'home'], ['Play', 'play'], ['Rules', 'rules'], ['News', 'news'], ['Settings', 'settings']].map(([label, page]) => <button type="button" key={page} onClick={() => onNavigate(page)}>{label}</button>)}</nav><span className="copyright">© 2026 Neural Knight. All rights reserved.</span></div></footer>
}

export default Footer