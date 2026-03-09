interface MemoryPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number
  }
}

const SAMPLE_INTERVAL_MS = 5000

export function shouldEnablePerfProbe(): boolean {
  return new URLSearchParams(window.location.search).has('perf')
}

export function startPerfProbe(): () => void {
  let frameCount = 0
  let droppedFrames = 0
  let lastFrameTs = performance.now()
  let lastReportTs = performance.now()
  let animationFrameId = 0

  const report = () => {
    const perf = performance as MemoryPerformance
    const memoryMb = perf.memory
      ? Math.round(perf.memory.usedJSHeapSize / (1024 * 1024))
      : 'n/a'

    console.log(
      `[perf] fps=${frameCount / 5}s dropped=${droppedFrames} heapMb=${memoryMb}`,
    )

    frameCount = 0
    droppedFrames = 0
    lastReportTs = performance.now()
  }

  const loop = (ts: number) => {
    const delta = ts - lastFrameTs
    lastFrameTs = ts
    frameCount += 1

    if (delta > 24) {
      droppedFrames += 1
    }

    if (ts - lastReportTs >= SAMPLE_INTERVAL_MS) {
      report()
    }

    animationFrameId = window.requestAnimationFrame(loop)
  }

  animationFrameId = window.requestAnimationFrame(loop)

  return () => {
    window.cancelAnimationFrame(animationFrameId)
  }
}
