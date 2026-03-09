type IdleHandle = number

interface IdleDeadline {
  didTimeout: boolean
  timeRemaining: () => number
}

type IdleCallback = (deadline: IdleDeadline) => void

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleCallback,
    opts?: { timeout: number },
  ) => IdleHandle
  cancelIdleCallback?: (handle: IdleHandle) => void
}

export function runWhenIdle(task: () => void, timeout = 300): () => void {
  const win = window as IdleWindow

  if (typeof win.requestIdleCallback === 'function') {
    const id = win.requestIdleCallback(() => task(), { timeout })
    return () => {
      if (typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(id)
      }
    }
  }

  const id = window.setTimeout(task, 32)
  return () => window.clearTimeout(id)
}
