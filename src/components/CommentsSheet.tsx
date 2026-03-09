import type { FeedItem } from '../types/feed'

interface CommentsSheetProps {
  open: boolean
  item: FeedItem | null
  onClose: () => void
}

const MOCK_COMMENTS = [
  'Smooth transitions and timing.',
  'Love this angle and pacing.',
  'Great framing for vertical video.',
  'Audio sync is really clean.',
  'Solid edit for interview demo.',
]

export function CommentsSheet({ open, item, onClose }: CommentsSheetProps) {
  return (
    <div className={`comments-sheet ${open ? 'comments-sheet--open' : ''}`}>
      <div className="comments-sheet__backdrop" onClick={onClose} />
      <div className="comments-sheet__panel" role="dialog" aria-modal="true">
        <header className="comments-sheet__header">
          <h2>Comments</h2>
          <button
            type="button"
            className="comments-sheet__close"
            onClick={onClose}
            aria-label="Close comments"
          >
            x
          </button>
        </header>
        <p className="comments-sheet__meta">{item?.author ?? '@creator'}</p>
        <ul className="comments-sheet__list">
          {MOCK_COMMENTS.map((comment, index) => (
            <li key={`${comment}-${index}`}>
              <span className="comments-sheet__user">@viewer{index + 1}</span>
              <span>{comment}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
