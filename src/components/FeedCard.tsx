import { useEffect, useRef } from 'react'
import { formatCompact, getViewerState, type FeedState } from '../store/feedReducer'
import type { FeedItem } from '../types/feed'
import type { PlaybackController } from '../lib/playbackController'

interface FeedCardProps {
  item: FeedItem
  state: FeedState
  isActive: boolean
  shouldRenderVideo: boolean
  playbackController: PlaybackController
  onLike: (itemId: string) => void
  onSave: (itemId: string) => void
  onShare: (itemId: string) => void
  onComment: (itemId: string) => void
}

export function FeedCard({
  item,
  state,
  isActive,
  shouldRenderVideo,
  playbackController,
  onLike,
  onSave,
  onShare,
  onComment,
}: FeedCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const viewerState = getViewerState(state, item.id)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !shouldRenderVideo) {
      return
    }

    playbackController.registerItem(item.id, video)

    return () => {
      playbackController.unregisterItem(item.id)
    }
  }, [item.id, playbackController, shouldRenderVideo])

  return (
    <article className={`feed-card ${isActive ? 'feed-card--active' : ''}`}>
      <div className="feed-card__media" aria-hidden={!isActive}>
        {shouldRenderVideo ? (
          <video
            ref={videoRef}
            src={item.videoUrl}
            poster={item.posterUrl}
            loop
            muted
            preload="metadata"
            playsInline
            className="feed-card__video"
          />
        ) : (
          <img src={item.posterUrl} alt="video poster" className="feed-card__poster" />
        )}
        <div className="feed-card__scrim" />
      </div>

      <header className="feed-card__top-bar">
        <span className="feed-card__tab">Following</span>
        <span className="feed-card__tab feed-card__tab--active">For You</span>
      </header>

      <aside className="feed-card__actions" aria-label="Video actions">
        <button
          type="button"
          className={`feed-action ${viewerState.liked ? 'feed-action--active' : ''}`}
          onClick={() => onLike(item.id)}
        >
          <span className="feed-action__icon">L</span>
          <span>{formatCompact(item.stats.likes)}</span>
        </button>
        <button
          type="button"
          className="feed-action"
          onClick={() => onComment(item.id)}
        >
          <span className="feed-action__icon">C</span>
          <span>{formatCompact(item.stats.comments)}</span>
        </button>
        <button
          type="button"
          className={`feed-action ${viewerState.saved ? 'feed-action--active' : ''}`}
          onClick={() => onSave(item.id)}
        >
          <span className="feed-action__icon">S</span>
          <span>{formatCompact(item.stats.saved)}</span>
        </button>
        <button
          type="button"
          className="feed-action"
          onClick={() => onShare(item.id)}
        >
          <span className="feed-action__icon">Sh</span>
          <span>{formatCompact(item.stats.shares)}</span>
        </button>
      </aside>

      <footer className="feed-card__meta">
        <p className="feed-card__author">{item.author}</p>
        <p className="feed-card__description">{item.description}</p>
        <p className="feed-card__duration">{Math.round(item.durationMs / 1000)} sec clip</p>
      </footer>
    </article>
  )
}
