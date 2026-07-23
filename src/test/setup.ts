import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })

  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}
