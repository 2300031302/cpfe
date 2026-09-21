function VideoCard({ video, index }) {
  return <article className="video-card"><div className="video-thumb"><span className="thumb-mark">♞</span><span className="thumb-index">FILM 0{index + 1}</span></div><div className="video-body"><h3 className="video-title">{video.title}</h3><p className="video-description">{video.description}</p><a className="watch-button" href={video.url} target="_blank" rel="noreferrer">Watch video</a></div></article>
}

export default VideoCard