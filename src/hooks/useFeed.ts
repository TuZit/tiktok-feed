import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { getFeed, postInteraction } from '../lib/mockApi'
import { runWhenIdle } from '../lib/idle'
import { PlaybackController } from '../lib/playbackController'
import {
  feedReducer,
  getInteractionSnapshot,
  initialFeedState,
} from '../store/feedReducer'
import type { InteractionType } from '../types/feed'

const PAGE_SIZE = 8
const WINDOW_OVERSCAN = 2

function getWindowRange(activeIndex: number, total: number): {
  start: number
  end: number
} {
  if (total === 0) {
    return { start: 0, end: 0 }
  }

  if (activeIndex < 0) {
    return { start: 0, end: Math.min(total - 1, WINDOW_OVERSCAN * 2) }
  }

  return {
    start: Math.max(0, activeIndex - WINDOW_OVERSCAN),
    end: Math.min(total - 1, activeIndex + WINDOW_OVERSCAN),
  }
}

export function useFeed() {
  const [state, dispatch] = useReducer(feedReducer, initialFeedState)
  const pageCacheRef = useRef<Map<string, Awaited<ReturnType<typeof getFeed>>>>(
    new Map(),
  )
  const playbackController = useMemo(() => new PlaybackController(), [])

  const loadNextPage = useCallback(async () => {
    if (state.loading || !state.hasMore) {
      return
    }

    const cursor = state.cursor ?? '0'
    const cacheKey = `${cursor}:${PAGE_SIZE}`

    const cached = pageCacheRef.current.get(cacheKey)
    if (cached) {
      dispatch({ type: 'loadSuccess', payload: cached })
      return
    }

    dispatch({ type: 'loadStart' })

    try {
      const payload = await getFeed({ cursor: state.cursor, limit: PAGE_SIZE })
      pageCacheRef.current.set(cacheKey, payload)
      dispatch({ type: 'loadSuccess', payload })
    } catch {
      dispatch({ type: 'loadError', payload: 'Cannot load feed right now.' })
    }
  }, [state.cursor, state.hasMore, state.loading])

  useEffect(() => {
    if (state.items.length === 0 && !state.loading) {
      void loadNextPage()
    }
  }, [loadNextPage, state.items.length, state.loading])

  const activeIndex = useMemo(() => {
    if (!state.activeId) {
      return state.items.length > 0 ? 0 : -1
    }

    return state.items.findIndex((item) => item.id === state.activeId)
  }, [state.activeId, state.items])

  useEffect(() => {
    if (!state.activeId && state.items.length > 0) {
      dispatch({ type: 'setActive', payload: state.items[0].id })
    }
  }, [state.activeId, state.items])

  useEffect(() => {
    const nearEnd = activeIndex >= state.items.length - 3
    if (nearEnd && state.hasMore && !state.loading) {
      void loadNextPage()
    }
  }, [activeIndex, loadNextPage, state.hasMore, state.items.length, state.loading])

  useEffect(() => {
    playbackController.setActiveItem(state.activeId)
  }, [playbackController, state.activeId])

  useEffect(() => {
    if (activeIndex < 0) {
      return
    }

    const around = [
      state.items[activeIndex - 1],
      state.items[activeIndex + 1],
      state.items[activeIndex + 2],
    ].filter(Boolean)

    const cancelIdle = runWhenIdle(() => {
      around.forEach((item) => {
        if (!item) {
          return
        }

        playbackController.prefetchVideo(item.videoUrl)

        const image = new Image()
        image.decoding = 'async'
        image.src = item.posterUrl
      })
    })

    return () => {
      cancelIdle()
    }
  }, [activeIndex, playbackController, state.items])

  const interact = useCallback(
    async (itemId: string, actionType: InteractionType) => {
      const snapshot = getInteractionSnapshot(state, itemId)
      if (!snapshot) {
        return
      }

      dispatch({
        type: 'optimisticInteraction',
        payload: { itemId, actionType },
      })

      runWhenIdle(() => {
        console.log(`[analytics] ${actionType} ${itemId}`)
      })

      try {
        await postInteraction({ itemId, actionType })
      } catch {
        dispatch({
          type: 'rollbackInteraction',
          payload: { itemId, snapshot },
        })
      }
    },
    [state],
  )

  const windowRange = useMemo(
    () => getWindowRange(activeIndex, state.items.length),
    [activeIndex, state.items.length],
  )

  return {
    state,
    activeIndex,
    windowRange,
    playbackController,
    setActiveItem: (id: string | null) => {
      dispatch({ type: 'setActive', payload: id })
    },
    interact,
    loadNextPage,
  }
}
