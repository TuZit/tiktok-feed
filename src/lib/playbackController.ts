const MAX_PRELOAD_LINKS = 6

export class PlaybackController {
  private activeId: string | null = null

  private readonly videos = new Map<string, HTMLVideoElement>()

  private readonly preloadLinks = new Map<string, HTMLLinkElement>()

  registerItem(id: string, video: HTMLVideoElement): void {
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    this.videos.set(id, video)

    if (this.activeId === id) {
      this.play(video)
      return
    }

    video.pause()
  }

  unregisterItem(id: string): void {
    const video = this.videos.get(id)

    if (video) {
      video.pause()
      this.videos.delete(id)
    }

    if (this.activeId === id) {
      this.activeId = null
    }
  }

  setActiveItem(id: string | null): void {
    this.activeId = id

    this.videos.forEach((video, videoId) => {
      if (id && videoId === id) {
        this.play(video)
      } else {
        video.pause()
      }
    })
  }

  prefetchVideo(url: string): void {
    if (!url || this.preloadLinks.has(url)) {
      return
    }

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'video'
    link.href = url

    document.head.appendChild(link)
    this.preloadLinks.set(url, link)

    if (this.preloadLinks.size > MAX_PRELOAD_LINKS) {
      const oldestUrl = this.preloadLinks.keys().next().value
      if (!oldestUrl) {
        return
      }

      const oldestLink = this.preloadLinks.get(oldestUrl)
      if (oldestLink) {
        oldestLink.remove()
      }
      this.preloadLinks.delete(oldestUrl)
    }
  }

  getActiveItem(): string | null {
    return this.activeId
  }

  getRegisteredCount(): number {
    return this.videos.size
  }

  private play(video: HTMLVideoElement): void {
    void video.play().catch(() => {
      // Autoplay can fail in some browser policies. We keep feed stable.
    })
  }
}
