import type { Requirement, ChecklistItem } from '../db/schema.js'
import { getDaysUntilDue, getTimelineStatus } from '../utils/date.js'

export interface TimelineEvent {
  id: string
  title: string
  date: string
  status: 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETE'
  relatedRequirementId: string
  daysUntilDue: number
}

export interface ReadinessReport {
  readinessScore: number
  totalRequired: number
  completedRequired: number
  missingRequirements: Requirement[]
  nextMilestones: TimelineEvent[]
}

export function computeReadinessScore(
  checklist: ChecklistItem[],
  requirements: Requirement[],
): { score: number; totalRequired: number; completedRequired: number } {
  const required = requirements.filter((r) => r.required)
  const completedRequired = checklist.filter(
    (item) =>
      item.status === 'COMPLETE' && required.some((r) => r.id === item.requirementId),
  ).length

  return {
    score: required.length === 0 ? 0 : Math.round((completedRequired / required.length) * 100),
    totalRequired: required.length,
    completedRequired,
  }
}

export function getMissingRequirements(
  checklist: ChecklistItem[],
  requirements: Requirement[],
): Requirement[] {
  return requirements.filter((req) => {
    const item = checklist.find((i) => i.requirementId === req.id)
    return !item || item.status !== 'COMPLETE'
  })
}

export function buildTimeline(
  checklist: ChecklistItem[],
  requirements: Requirement[],
): TimelineEvent[] {
  return requirements
    .map((req) => {
      const item = checklist.find((i) => i.requirementId === req.id)
      const dueDate = item?.dueDate ?? ''
      const isComplete = item?.status === 'COMPLETE'

      return {
        id: `evt-${req.id}`,
        title: req.title,
        date: dueDate,
        status: getTimelineStatus(dueDate, isComplete),
        relatedRequirementId: req.id,
        daysUntilDue: getDaysUntilDue(dueDate),
      } satisfies TimelineEvent
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function buildReadinessReport(
  checklist: ChecklistItem[],
  requirements: Requirement[],
): ReadinessReport {
  const { score, totalRequired, completedRequired } = computeReadinessScore(
    checklist,
    requirements,
  )
  const timeline = buildTimeline(checklist, requirements)
  const nextMilestones = timeline
    .filter((e) => e.status !== 'COMPLETE')
    .slice(0, 5)

  return {
    readinessScore: score,
    totalRequired,
    completedRequired,
    missingRequirements: getMissingRequirements(checklist, requirements),
    nextMilestones,
  }
}
