import { useEffect, useMemo, useRef, useState } from 'react'
import { CommentsSheet } from './components/CommentsSheet'
import { FeedCard } from './components/FeedCard'
import { shouldEnablePerfProbe, startPerfProbe } from './lib/perfProbe'
import { useFeed } from './hooks/useFeed'
import type { FeedItem } from './types/feed'
import './App.css'

function findBestVisibleId(
  entries: IntersectionObserverEntry[],
): string | null {
  let bestId: string | null = null
  let bestRatio = 0

  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return
    }

    const id = entry.target.getAttribute('data-feed-id')
    if (!id) {
      return
    }

    if (entry.intersectionRatio > bestRatio) {
      bestId = id
      bestRatio = entry.intersectionRatio
    }
  })

  return bestRatio >= 0.8 ? bestId : null
}

function App() {
  const {
    state,
    activeIndex,
    windowRange,
    playbackController,
    setActiveItem,
    interact,
  } = useFeed()

  const [commentsForId, setCommentsForId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  useEffect(() => {
    if (!shouldEnablePerfProbe()) {
      return
    }

    return startPerfProbe()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const id = findBestVisibleId(entries)
        if (id) {
          setActiveItem(id)
        }
      },
      {
        root: container,
        threshold: [0.6, 0.8, 0.95],
      },
    )

    sectionRefs.current.forEach((node) => {
      observer.observe(node)
    })

    return () => {
      observer.disconnect()
    }
  }, [state.items, setActiveItem])

  const activeItem = useMemo<FeedItem | null>(() => {
    if (!state.activeId) {
      return null
    }

    return state.items.find((item) => item.id === state.activeId) ?? null
  }, [state.activeId, state.items])

  return (
    <div className="app-shell">
      <main className="feed-container" ref={containerRef} aria-label="TikTok style feed">
        {state.items.map((item, index) => {
          const shouldRenderVideo =
            index >= windowRange.start && index <= windowRange.end

          return (
            <section
              key={item.id}
              className="feed-page"
              data-feed-id={item.id}
              ref={(node) => {
                if (!node) {
                  sectionRefs.current.delete(item.id)
                  return
                }

                sectionRefs.current.set(item.id, node)
              }}
            >
              <FeedCard
                item={item}
                state={state}
                isActive={state.activeId === item.id}
                shouldRenderVideo={shouldRenderVideo}
                playbackController={playbackController}
                onLike={(itemId) => void interact(itemId, 'like')}
                onSave={(itemId) => void interact(itemId, 'save')}
                onShare={(itemId) => void interact(itemId, 'share')}
                onComment={(itemId) => {
                  setCommentsForId(itemId)
                  void interact(itemId, 'comment')
                }}
              />
            </section>
          )
        })}

        {state.loading && (
          <div className="feed-loading" role="status">
            Loading next videos...
          </div>
        )}

        {state.error && <div className="feed-error">{state.error}</div>}
      </main>

      <div className="feed-debug">
        <span>Active: {Math.max(activeIndex + 1, 1)}</span>
        <span>Mounted videos: {playbackController.getRegisteredCount()}</span>
        <span>Items loaded: {state.items.length}</span>
      </div>

      <CommentsSheet
        open={Boolean(commentsForId)}
        item={activeItem}
        onClose={() => setCommentsForId(null)}
      />
    </div>
  )
}

export default App
