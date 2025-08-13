import { vi } from 'vitest'

// Mock CSS imports
vi.mock('vuetify/styles', () => ({}))
vi.mock('@mdi/font/css/materialdesignicons.css', () => ({}))
vi.mock('../styles/responsive.scss', () => ({}))

// Mock window properties
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock CSS.supports
global.CSS = {
  supports: vi.fn().mockReturnValue(true),
}

// Mock navigator properties
Object.defineProperty(navigator, 'userAgent', {
  value:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  configurable: true,
})

Object.defineProperty(navigator, 'maxTouchPoints', {
  value: 0,
  configurable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn().mockImplementation((id) => clearTimeout(id))

// Mock performance
global.performance = {
  now: vi.fn().mockReturnValue(Date.now()),
}

// Mock getComputedStyle
global.getComputedStyle = vi.fn().mockReturnValue({
  getPropertyValue: vi.fn().mockReturnValue(''),
})

// Mock document.documentElement.style
const mockStyle = {
  setProperty: vi.fn((property, value) => {
    mockStyle[property] = value
  }),
  getPropertyValue: vi.fn((property) => {
    return mockStyle[property] || ''
  }),
}

Object.defineProperty(document.documentElement, 'style', {
  value: mockStyle,
  configurable: true,
})

// Mock canvas for image format detection
HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,')

// Mock vibrate API
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  configurable: true,
})
