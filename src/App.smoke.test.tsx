import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

type TriggerIntersection = (target: Element, ratio?: number) => void

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
})
