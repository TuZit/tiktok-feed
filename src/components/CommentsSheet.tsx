import { useEffect, useId, useRef } from 'react'
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
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    lastFocusedElementRef.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      lastFocusedElementRef.current?.focus()
    }
  }, [onClose, open])

  return (
    <div className={`comments-sheet ${open ? 'comments-sheet--open' : ''}`}>
      <div className="comments-sheet__backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        className="comments-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="comments-sheet__header">
          <h2 id={titleId}>Comments</h2>
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
