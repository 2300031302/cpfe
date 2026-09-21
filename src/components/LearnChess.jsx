import VideoCard from './VideoCard'

function LearnChess({ videos }) {
  return <section className="learn-section" id="news"><div className="learn-heading"><div><div className="section-label">Curated study</div><h2 className="section-title">Learn Chess</h2></div><p className="learn-note">Short lessons and classic ideas for the next game.</p></div><div className="video-grid">{videos.map((video, index) => <VideoCard key={video.title} video={video} index={index} />)}</div></section>
}

export default LearnChess