import type { FeedItem, FeedResponse, InteractionType } from '../types/feed'

export interface ViewerState {
  liked: boolean
  saved: boolean
}

export interface FeedState {
  items: FeedItem[]
  cursor: string | null
  hasMore: boolean
  loading: boolean
  error: string | null
  activeId: string | null
  viewerById: Record<string, ViewerState>
}

export const initialFeedState: FeedState = {
  items: [],
  cursor: null,
  hasMore: true,
  loading: false,
  error: null,
  activeId: null,
  viewerById: {},
}

interface InteractionSnapshot {
  item: FeedItem
  viewerState: ViewerState
}

export type FeedAction =
  | { type: 'loadStart' }
  | {
      type: 'loadSuccess'
      payload: FeedResponse
    }
  | { type: 'loadError'; payload: string }
  | { type: 'setActive'; payload: string | null }
  | {
      type: 'optimisticInteraction'
      payload: { itemId: string; actionType: InteractionType }
    }
  | {
      type: 'rollbackInteraction'
      payload: { itemId: string; snapshot: InteractionSnapshot }
    }

export function getViewerState(
  state: FeedState,
  itemId: string,
): ViewerState {
  return state.viewerById[itemId] ?? { liked: false, saved: false }
}

export function getInteractionSnapshot(
  state: FeedState,
  itemId: string,
): InteractionSnapshot | null {
  const item = state.items.find((entry) => entry.id === itemId)
  if (!item) {
    return null
  }

  return {
    item,
    viewerState: getViewerState(state, itemId),
  }
}

function updateItem(
  items: FeedItem[],
  itemId: string,
  mutate: (item: FeedItem) => FeedItem,
): FeedItem[] {
  return items.map((item) => {
    if (item.id !== itemId) {
      return item
    }

    return mutate(item)
  })
}

export function feedReducer(state: FeedState, action: FeedAction): FeedState {
  switch (action.type) {
    case 'loadStart':
      return {
        ...state,
        loading: true,
        error: null,
      }

    case 'loadSuccess': {
      const existingIds = new Set(state.items.map((item) => item.id))
      const dedupedIncoming = action.payload.items.filter(
        (item) => !existingIds.has(item.id),
      )

      return {
        ...state,
        loading: false,
        error: null,
        items: [...state.items, ...dedupedIncoming],
        cursor: action.payload.nextCursor,
        hasMore: action.payload.hasMore,
      }
    }

    case 'loadError':
      return {
        ...state,
        loading: false,
        error: action.payload,
      }

    case 'setActive':
      return {
        ...state,
        activeId: action.payload,
      }

    case 'optimisticInteraction': {
      const { itemId, actionType } = action.payload
      const currentViewerState = getViewerState(state, itemId)

      if (actionType === 'like') {
        const liked = !currentViewerState.liked
        return {
          ...state,
          viewerById: {
            ...state.viewerById,
            [itemId]: {
              ...currentViewerState,
              liked,
            },
          },
          items: updateItem(state.items, itemId, (item) => ({
            ...item,
            stats: {
              ...item.stats,
              likes: Math.max(0, item.stats.likes + (liked ? 1 : -1)),
            },
          })),
        }
      }

      if (actionType === 'save') {
        const saved = !currentViewerState.saved
        return {
          ...state,
          viewerById: {
            ...state.viewerById,
            [itemId]: {
              ...currentViewerState,
              saved,
            },
          },
          items: updateItem(state.items, itemId, (item) => ({
            ...item,
            stats: {
              ...item.stats,
              saved: Math.max(0, item.stats.saved + (saved ? 1 : -1)),
            },
          })),
        }
      }

      if (actionType === 'share') {
        return {
          ...state,
          items: updateItem(state.items, itemId, (item) => ({
            ...item,
            stats: {
              ...item.stats,
              shares: item.stats.shares + 1,
            },
          })),
        }
      }

      return {
        ...state,
        items: updateItem(state.items, itemId, (item) => ({
          ...item,
          stats: {
            ...item.stats,
            comments: item.stats.comments + 1,
          },
        })),
      }
    }

    case 'rollbackInteraction': {
      const { itemId, snapshot } = action.payload
      return {
        ...state,
        viewerById: {
          ...state.viewerById,
          [itemId]: snapshot.viewerState,
        },
        items: updateItem(state.items, itemId, () => snapshot.item),
      }
    }

    default:
      return state
  }
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }

  return String(value)
}
