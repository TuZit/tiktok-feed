import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaybackController } from './playbackController'

function makeVideoElement() {
  const video = document.createElement('video')
  const play = vi.fn(async () => undefined)
  const pause = vi.fn()

  Object.defineProperty(video, 'play', {
    configurable: true,
    writable: true,
    value: play,
  })

  Object.defineProperty(video, 'pause', {
    configurable: true,
    writable: true,
    value: pause,
  })

  return { video, play, pause }
}

describe('PlaybackController', () => {
  let controller: PlaybackController

  beforeEach(() => {
    controller = new PlaybackController()
    document.head.innerHTML = ''
  })

  it('keeps only one active video playing', () => {
    const first = makeVideoElement()
    const second = makeVideoElement()

    controller.registerItem('a', first.video)
    controller.registerItem('b', second.video)

    controller.setActiveItem('a')
    expect(first.play).toHaveBeenCalledTimes(1)
    expect(second.pause).toHaveBeenCalled()

    controller.setActiveItem('b')
    expect(second.play).toHaveBeenCalledTimes(1)
  })

  it('caps preloaded links', () => {
    for (let index = 0; index < 10; index += 1) {
      controller.prefetchVideo(`/videos/clip-${index}.mp4`)
    }

    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="video"]')
    expect(preloadLinks.length).toBeLessThanOrEqual(6)
  })
})
