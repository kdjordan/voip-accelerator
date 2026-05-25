import '@testing-library/jest-dom'
import { afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/vue'

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})