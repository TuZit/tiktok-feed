import type { FeedItem } from '../types/feed'

function nonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }

  return Math.floor(value)
}

export function normalizeFeedItem(item: FeedItem): FeedItem {
  return {
    ...item,
    durationMs: nonNegative(item.durationMs),
    stats: {
      likes: nonNegative(item.stats.likes),
      comments: nonNegative(item.stats.comments),
      shares: nonNegative(item.stats.shares),
      saved: nonNegative(item.stats.saved),
    },
  }
}
