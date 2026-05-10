export function computeDueDate(applicationDeadline: string, dueOffsetDays: number): string {
  const deadline = new Date(applicationDeadline)
  deadline.setUTCDate(deadline.getUTCDate() - dueOffsetDays)
  return deadline.toISOString().split('T')[0]
}

export function getDaysUntilDue(dueDate: string): number {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

export function getTimelineStatus(
  dueDate: string,
  isComplete: boolean,
): 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETE' {
  if (isComplete) return 'COMPLETE'
  const days = getDaysUntilDue(dueDate)
  if (days < 0) return 'OVERDUE'
  if (days <= 14) return 'DUE_SOON'
  return 'UPCOMING'
}
