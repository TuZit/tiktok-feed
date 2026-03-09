import { normalizeFeedItem } from './feedNormalizer'
import type {
  FeedItem,
  FeedQuery,
  FeedResponse,
  InteractionPayload,
  InteractionResponse,
} from '../types/feed'

const AUTHORS = [
  '@rhythm.lab',
  '@streetframe',
  '@foodscope',
  '@nightcity',
  '@vibes.only',
  '@framecraft',
  '@movejournal',
  '@soundcheck',
]

const DESCRIPTIONS = [
  'POV: one-take energy and clean transitions.',
  'City lights test with low-light stabilization.',
  'Quick recipe cut under 20 seconds.',
  'Behind the scenes with handheld setup.',
  'Color grading A/B in natural light.',
  'Micro story in vertical format.',
  'Slow motion pass with simple choreography.',
  'Interview prep project: feed performance pass.',
]

const VIDEOS = ['/videos/clip-1.mp4', '/videos/clip-2.mp4', '/videos/clip-3.mp4']

const POSTERS = [
  '/posters/poster-1.svg',
  '/posters/poster-2.svg',
  '/posters/poster-3.svg',
  '/posters/poster-4.svg',
  '/posters/poster-5.svg',
  '/posters/poster-6.svg',
]

const FEED_TOTAL = 72
const PAGE_DELAY_MS = [90, 130, 180, 220]

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function seededNumber(seed: number, min: number, max: number): number {
  const value = (Math.sin(seed * 999) + 1) / 2
  return Math.floor(min + value * (max - min))
}

function createSeedFeed(total: number): FeedItem[] {
  return Array.from({ length: total }, (_, index) => {
    const id = `feed-${String(index + 1).padStart(3, '0')}`
    return normalizeFeedItem({
      id,
      videoUrl: VIDEOS[index % VIDEOS.length],
      posterUrl: POSTERS[index % POSTERS.length],
      author: AUTHORS[index % AUTHORS.length],
      description: DESCRIPTIONS[index % DESCRIPTIONS.length],
      durationMs: [5000, 10000, 5000][index % 3],
      stats: {
        likes: seededNumber(index + 11, 1200, 120000),
        comments: seededNumber(index + 31, 80, 6400),
        shares: seededNumber(index + 51, 40, 4200),
        saved: seededNumber(index + 71, 30, 8200),
      },
    })
  })
}

const FEED_DB = createSeedFeed(FEED_TOTAL)

export async function getFeed({
  cursor = null,
  limit = 8,
}: FeedQuery): Promise<FeedResponse> {
  const safeLimit = Math.max(1, Math.min(limit, 12))
  const offset = cursor ? Number.parseInt(cursor, 10) : 0
  const start = Number.isFinite(offset) && offset >= 0 ? offset : 0
  const end = Math.min(start + safeLimit, FEED_DB.length)

  const delay = PAGE_DELAY_MS[start % PAGE_DELAY_MS.length]
  await sleep(delay)

  const items = FEED_DB.slice(start, end).map((item) => normalizeFeedItem(item))
  const hasMore = end < FEED_DB.length

  return {
    items,
    nextCursor: hasMore ? String(end) : null,
    hasMore,
  }
}

export async function postInteraction({
  itemId,
  actionType,
}: InteractionPayload): Promise<InteractionResponse> {
  const feedItem = FEED_DB.find((item) => item.id === itemId)
  if (!feedItem) {
    throw new Error('Feed item does not exist')
  }

  await sleep(110)

  // Server accepts interaction and lets UI keep optimistic state.
  if (actionType === 'share') {
    feedItem.stats.shares += 1
  }

  return {
    ok: true,
    optimistic: true,
  }
}
