import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react'
import { CommentsSheet } from './components/CommentsSheet'
import { FeedCard } from './components/FeedCard'
import { shouldEnablePerfProbe, startPerfProbe } from './lib/perfProbe'
import { useFeed } from './hooks/useFeed'
import './App.css'

const VIRTUAL_OVERSCAN = 2

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
  const [scrollTop, setScrollTop] = useState(0)
  const [pageHeight, setPageHeight] = useState(0)

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

    const updatePageHeight = () => {
      setPageHeight(container.clientHeight)
    }

    updatePageHeight()

    const resizeObserver = new ResizeObserver(updatePageHeight)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  const handleLike = useCallback(
    (itemId: string) => {
      void interact(itemId, 'like')
    },
    [interact],
  )

  const handleSave = useCallback(
    (itemId: string) => {
      void interact(itemId, 'save')
    },
    [interact],
  )

  const handleShare = useCallback(
    (itemId: string) => {
      void interact(itemId, 'share')
    },
    [interact],
  )

  const handleComment = useCallback(
    (itemId: string) => {
      setCommentsForId(itemId)
      void interact(itemId, 'comment')
    },
    [interact],
  )

  const totalItems = state.items.length
  const hasPageHeight = pageHeight > 0

  const viewportIndex = useMemo(() => {
    if (totalItems === 0) {
      return -1
    }

    if (!hasPageHeight) {
      return Math.max(activeIndex, 0)
    }

    return Math.min(totalItems - 1, Math.floor(scrollTop / pageHeight))
  }, [activeIndex, hasPageHeight, pageHeight, scrollTop, totalItems])

  const renderRange = useMemo(() => {
    if (totalItems === 0) {
      return { start: 0, end: -1 }
    }

    if (!hasPageHeight || viewportIndex < 0) {
      return { start: 0, end: totalItems - 1 }
    }

    let start = Math.max(0, viewportIndex - VIRTUAL_OVERSCAN)
    let end = Math.min(totalItems - 1, viewportIndex + VIRTUAL_OVERSCAN)

    if (activeIndex >= 0) {
      start = Math.min(start, windowRange.start)
      end = Math.max(end, windowRange.end)
    }

    return { start, end }
  }, [activeIndex, hasPageHeight, totalItems, viewportIndex, windowRange.end, windowRange.start])

  const renderedItems = useMemo(
    () =>
      renderRange.end >= renderRange.start
        ? state.items.slice(renderRange.start, renderRange.end + 1)
        : [],
    [renderRange.end, renderRange.start, state.items],
  )

  const topSpacerHeight = hasPageHeight ? renderRange.start * pageHeight : 0
  const bottomSpacerHeight =
    hasPageHeight && renderRange.end >= renderRange.start
      ? Math.max(0, totalItems - renderRange.end - 1) * pageHeight
      : 0

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
  }, [renderRange.end, renderRange.start, setActiveItem])

  const commentsItem = useMemo(() => {
    if (!commentsForId) {
      return null
    }

    return state.items.find((item) => item.id === commentsForId) ?? null
  }, [commentsForId, state.items])

  return (
    <div className="app-shell">
      <main
        className="feed-container"
        ref={containerRef}
        onScroll={handleScroll}
        aria-label="TikTok style feed"
      >
        {topSpacerHeight > 0 && <div style={{ height: topSpacerHeight }} aria-hidden="true" />}

        {renderedItems.map((item, offset) => {
          const index = renderRange.start + offset
          const shouldRenderVideo =
            index >= windowRange.start && index <= windowRange.end
          const viewerState = state.viewerById[item.id]

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
                liked={viewerState?.liked ?? false}
                saved={viewerState?.saved ?? false}
                isActive={state.activeId === item.id}
                shouldRenderVideo={shouldRenderVideo}
                playbackController={playbackController}
                onLike={handleLike}
                onSave={handleSave}
                onShare={handleShare}
                onComment={handleComment}
              />
            </section>
          )
        })}

        {bottomSpacerHeight > 0 && <div style={{ height: bottomSpacerHeight }} aria-hidden="true" />}

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
        item={commentsItem}
        onClose={() => setCommentsForId(null)}
      />
    </div>
  )
}

export default App
