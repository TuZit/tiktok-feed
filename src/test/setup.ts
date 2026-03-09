import '@testing-library/jest-dom/vitest'

interface TriggerEntry {
  target: Element
  intersectionRatio: number
}

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  readonly root: Element | null = null

  readonly rootMargin = '0px'

  readonly thresholds: ReadonlyArray<number> = [0]

  private readonly callback: IntersectionObserverCallback

  private readonly elements = new Set<Element>()

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }

  disconnect(): void {
    this.elements.clear()
  }

  observe(target: Element): void {
    this.elements.add(target)
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  unobserve(target: Element): void {
    this.elements.delete(target)
  }

  trigger({ target, intersectionRatio }: TriggerEntry): void {
    if (!this.elements.has(target)) {
      return
    }

    const entry = {
      target,
      isIntersecting: intersectionRatio > 0,
      intersectionRatio,
      time: Date.now(),
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
    } as IntersectionObserverEntry

    this.callback([entry], this)
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  writable: true,
  configurable: true,
  value: () => Promise.resolve(),
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  writable: true,
  configurable: true,
  value: () => undefined,
})

;(globalThis as Record<string, unknown>).__triggerIntersection = (
  target: Element,
  ratio = 0.95,
) => {
  MockIntersectionObserver.instances.forEach((instance) => {
    instance.trigger({ target, intersectionRatio: ratio })
  })
}
