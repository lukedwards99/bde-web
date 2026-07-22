import { describe, expect, it } from 'vitest'
import { redirectedPath } from '../routeFallback'

describe('redirectedPath', () => {
  it('restores production paths with queries and hashes', () => {
    const requested = '/bde-web/blogs/lukes-blog/welcome?source=email#programming'
    const url = new URL(`https://example.com/bde-web/?redirect=${encodeURIComponent(requested)}`)

    expect(redirectedPath(url, '/bde-web/')).toBe(requested)
  })

  it('restores development paths against the development base', () => {
    const requested = '/bde-web/dev/blogs/lukes-blog'
    const url = new URL(`https://example.com/bde-web/dev/?redirect=${encodeURIComponent(requested)}`)

    expect(redirectedPath(url, '/bde-web/dev/')).toBe(requested)
  })

  it('rejects redirects outside the active deployment base', () => {
    const url = new URL('https://example.com/bde-web/?redirect=https%3A%2F%2Fevil.example')
    expect(redirectedPath(url, '/bde-web/')).toBeUndefined()
  })
})
