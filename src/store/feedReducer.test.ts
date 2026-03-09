import { describe, expect, it } from 'vitest'
import {
  feedReducer,
  formatCompact,
  getInteractionSnapshot,
  initialFeedState,
} from './feedReducer'
import type { FeedItem } from '../types/feed'

function makeItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'feed-001',
    videoUrl: '/videos/clip-1.mp4',
    posterUrl: '/posters/poster-1.svg',
    author: '@demo',
    description: 'sample',
    durationMs: 5000,
    stats: {
      likes: 100,
      comments: 20,
      shares: 10,
      saved: 5,
    },
    ...overrides,
  }
}

describe('feedReducer', () => {
  it('deduplicates items when loadSuccess appends', () => {
    const start = {
      ...initialFeedState,
      items: [makeItem()],
    }

    const next = feedReducer(start, {
      type: 'loadSuccess',
      payload: {
        items: [makeItem(), makeItem({ id: 'feed-002' })],
        nextCursor: '2',
        hasMore: true,
      },
    })

    expect(next.items).toHaveLength(2)
    expect(next.items[1].id).toBe('feed-002')
  })

  it('toggles like with optimistic interaction', () => {
    const start = {
      ...initialFeedState,
      items: [makeItem()],
    }

    const liked = feedReducer(start, {
      type: 'optimisticInteraction',
      payload: { itemId: 'feed-001', actionType: 'like' },
    })

    expect(liked.items[0].stats.likes).toBe(101)

    const unliked = feedReducer(liked, {
      type: 'optimisticInteraction',
      payload: { itemId: 'feed-001', actionType: 'like' },
    })

    expect(unliked.items[0].stats.likes).toBe(100)
  })

  it('rolls back interaction from snapshot', () => {
    const start = {
      ...initialFeedState,
      items: [makeItem()],
    }

    const snapshot = getInteractionSnapshot(start, 'feed-001')
    expect(snapshot).not.toBeNull()

    const liked = feedReducer(start, {
      type: 'optimisticInteraction',
      payload: { itemId: 'feed-001', actionType: 'like' },
    })

    const rolledBack = feedReducer(liked, {
      type: 'rollbackInteraction',
      payload: { itemId: 'feed-001', snapshot: snapshot! },
    })

    expect(rolledBack.items[0].stats.likes).toBe(100)
  })
})

describe('formatCompact', () => {
  it('formats compact counts', () => {
    expect(formatCompact(999)).toBe('999')
    expect(formatCompact(1200)).toBe('1.2K')
    expect(formatCompact(4_500_000)).toBe('4.5M')
  })
})
