import { describe, it, expect } from 'vitest'
import { computeDueDate, getDaysUntilDue, getTimelineStatus } from '../src/utils/date.js'

describe('computeDueDate', () => {
  it('subtracts offset days from the deadline', () => {
    expect(computeDueDate('2026-12-01', 30)).toBe('2026-11-01')
  })

  it('handles month boundary correctly', () => {
    expect(computeDueDate('2026-03-01', 10)).toBe('2026-02-19')
  })

  it('handles zero offset', () => {
    expect(computeDueDate('2026-12-01', 0)).toBe('2026-12-01')
  })
})

describe('getTimelineStatus', () => {
  it('returns COMPLETE when item is complete regardless of date', () => {
    expect(getTimelineStatus('2020-01-01', true)).toBe('COMPLETE')
  })

  it('returns OVERDUE for a past date that is not complete', () => {
    expect(getTimelineStatus('2020-01-01', false)).toBe('OVERDUE')
  })

  it('returns DUE_SOON for a date within 14 days', () => {
    const soon = new Date()
    soon.setUTCDate(soon.getUTCDate() + 7)
    const dueDate = soon.toISOString().split('T')[0]
    expect(getTimelineStatus(dueDate, false)).toBe('DUE_SOON')
  })

  it('returns UPCOMING for a date more than 14 days away', () => {
    const future = new Date()
    future.setUTCDate(future.getUTCDate() + 60)
    const dueDate = future.toISOString().split('T')[0]
    expect(getTimelineStatus(dueDate, false)).toBe('UPCOMING')
  })
})
