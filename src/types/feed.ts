export interface FeedStats {
  likes: number
  comments: number
  shares: number
  saved: number
}

export interface FeedItem {
  id: string
  videoUrl: string
  posterUrl: string
  author: string
  description: string
  stats: FeedStats
  durationMs: number
}

export interface FeedResponse {
  items: FeedItem[]
  nextCursor: string | null
  hasMore: boolean
}

export interface FeedQuery {
  cursor?: string | null
  limit?: number
}

export type InteractionType = 'like' | 'save' | 'share' | 'comment'

export interface InteractionPayload {
  itemId: string
  actionType: InteractionType
}

export interface InteractionResponse {
  ok: true
  optimistic: true
}
