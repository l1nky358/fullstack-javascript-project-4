import { describe, it, expect } from 'vitest'
import pageLoader from './index.js'

describe('index', () => {
  it('should export pageLoader function', () => {
    expect(pageLoader).toBeDefined()
    expect(typeof pageLoader).toBe('function')
  })
})
