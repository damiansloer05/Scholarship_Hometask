import { describe, it, expect } from 'vitest'
import {
  computeReadinessScore,
  getMissingRequirements,
  buildReadinessReport,
} from '../src/services/readiness.js'
import type { Requirement, ChecklistItem } from '../src/db/schema.js'

const makeReq = (overrides: Partial<Requirement> = {}): Requirement => ({
  id: 'req-1',
  programId: 'prog-1',
  type: 'DOCUMENTS',
  title: 'Transcripts',
  description: 'Official transcripts',
  dueOffsetDays: 30,
  required: true,
  evidenceType: 'PDF',
  ...overrides,
})

const makeItem = (overrides: Partial<ChecklistItem> = {}): ChecklistItem => ({
  id: 'item-1',
  profileId: 'profile-1',
  programId: 'prog-1',
  requirementId: 'req-1',
  status: 'PENDING',
  dueDate: '2026-11-01',
  notes: null,
  updatedAt: new Date(),
  ...overrides,
})

describe('computeReadinessScore', () => {
  it('returns 0 when no items are complete', () => {
    const reqs = [makeReq({ id: 'r1' }), makeReq({ id: 'r2' })]
    const items = [makeItem({ requirementId: 'r1', status: 'PENDING' })]
    const { score } = computeReadinessScore(items, reqs)
    expect(score).toBe(0)
  })

  it('returns 50 when half of required items are complete', () => {
    const reqs = [makeReq({ id: 'r1' }), makeReq({ id: 'r2' })]
    const items = [
      makeItem({ requirementId: 'r1', status: 'COMPLETE' }),
      makeItem({ requirementId: 'r2', status: 'PENDING' }),
    ]
    const { score } = computeReadinessScore(items, reqs)
    expect(score).toBe(50)
  })

  it('returns 100 when all required items are complete', () => {
    const reqs = [makeReq({ id: 'r1' }), makeReq({ id: 'r2' })]
    const items = [
      makeItem({ requirementId: 'r1', status: 'COMPLETE' }),
      makeItem({ requirementId: 'r2', status: 'COMPLETE' }),
    ]
    const { score } = computeReadinessScore(items, reqs)
    expect(score).toBe(100)
  })

  it('ignores optional requirements in score calculation', () => {
    const reqs = [
      makeReq({ id: 'r1', required: true }),
      makeReq({ id: 'r2', required: false }),
    ]
    const items = [makeItem({ requirementId: 'r1', status: 'COMPLETE' })]
    const { score, totalRequired } = computeReadinessScore(items, reqs)
    expect(score).toBe(100)
    expect(totalRequired).toBe(1)
  })
})

describe('getMissingRequirements', () => {
  it('returns requirements with no checklist item', () => {
    const reqs = [makeReq({ id: 'r1' }), makeReq({ id: 'r2' })]
    const items = [makeItem({ requirementId: 'r1', status: 'COMPLETE' })]
    const missing = getMissingRequirements(items, reqs)
    expect(missing).toHaveLength(1)
    expect(missing[0].id).toBe('r2')
  })

  it('returns requirements with PENDING or IN_PROGRESS status', () => {
    const reqs = [makeReq({ id: 'r1' }), makeReq({ id: 'r2' })]
    const items = [
      makeItem({ requirementId: 'r1', status: 'IN_PROGRESS' }),
      makeItem({ requirementId: 'r2', status: 'COMPLETE' }),
    ]
    const missing = getMissingRequirements(items, reqs)
    expect(missing).toHaveLength(1)
    expect(missing[0].id).toBe('r1')
  })
})

describe('buildReadinessReport', () => {
  it('produces a consistent report structure', () => {
    const reqs = [makeReq({ id: 'r1' }), makeReq({ id: 'r2' })]
    const items = [makeItem({ requirementId: 'r1', status: 'COMPLETE', dueDate: '2030-01-01' })]
    const report = buildReadinessReport(items, reqs)

    expect(report.readinessScore).toBe(50)
    expect(report.totalRequired).toBe(2)
    expect(report.completedRequired).toBe(1)
    expect(report.missingRequirements).toHaveLength(1)
  })
})
