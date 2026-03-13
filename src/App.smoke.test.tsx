import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as mockApi from './lib/mockApi'
import App from './App'

type TriggerIntersection = (target: Element, ratio?: number) => void

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App smoke', () => {
  it('loads feed, keeps a small number of mounted video nodes, and switches active item', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Items loaded:/)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(document.querySelectorAll('.feed-page').length).toBeGreaterThan(1)
    })

    const triggerIntersection = (globalThis as Record<string, unknown>)
      .__triggerIntersection as TriggerIntersection

    const pages = document.querySelectorAll('.feed-page')
    triggerIntersection(pages[0], 0.95)

    await waitFor(() => {
      expect(screen.getByText('Active: 1')).toBeInTheDocument()
    })

    triggerIntersection(pages[1], 0.95)

    await waitFor(() => {
      expect(screen.getByText('Active: 2')).toBeInTheDocument()
    })

    expect(document.querySelectorAll('video').length).toBeLessThanOrEqual(5)
  })

  it('opens comments for the clicked card data', async () => {
    render(<App />)

    await waitFor(() => {
      expect(document.querySelectorAll('.feed-page').length).toBeGreaterThan(1)
    })

    expect(screen.getByText('Active: 1')).toBeInTheDocument()

    const triggerIntersection = (globalThis as Record<string, unknown>)
      .__triggerIntersection as TriggerIntersection

    const pages = document.querySelectorAll('.feed-page')
    const secondPageActions = pages[1]?.querySelectorAll('button.feed-action')

    expect(secondPageActions).toBeTruthy()
    expect(secondPageActions?.[1]).toBeTruthy()

    fireEvent.click(secondPageActions![1])
    triggerIntersection(pages[1], 0.95)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('@streetframe')).toBeInTheDocument()
    })
  })

  it('retries feed loading after an initial failure', async () => {
    const actualApi = await vi.importActual<typeof import('./lib/mockApi')>('./lib/mockApi')

    vi.spyOn(mockApi, 'getFeed')
      .mockRejectedValueOnce(new Error('network down'))
      .mockImplementation(actualApi.getFeed)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Cannot load feed right now.')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText(/Items loaded:/)).toBeInTheDocument()
      expect(screen.queryByText('Cannot load feed right now.')).not.toBeInTheDocument()
    })
  })
})
