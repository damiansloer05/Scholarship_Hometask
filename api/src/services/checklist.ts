import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { checklistItems, requirements, programs } from '../db/schema.js'
import { computeDueDate } from '../utils/date.js'
import type { ChecklistItem } from '../db/schema.js'

export async function getOrCreateChecklist(
  profileId: string,
  programId: string,
): Promise<ChecklistItem[]> {
  const existing = await db
    .select()
    .from(checklistItems)
    .where(
      and(eq(checklistItems.profileId, profileId), eq(checklistItems.programId, programId)),
    )

  if (existing.length > 0) return existing

  await db.transaction(async (tx) => {
    const reqs = await tx
      .select()
      .from(requirements)
      .where(eq(requirements.programId, programId))

    if (reqs.length === 0) return

    const [program] = await tx
      .select({ applicationDeadline: programs.applicationDeadline })
      .from(programs)
      .where(eq(programs.id, programId))

    if (!program) throw new Error(`Program ${programId} not found`)

    const rows = reqs.map((req) => ({
      profileId,
      programId,
      requirementId: req.id,
      status: 'PENDING' as const,
      dueDate: computeDueDate(program.applicationDeadline, req.dueOffsetDays),
    }))

    await tx.insert(checklistItems).values(rows).onConflictDoNothing()
  })

  return db
    .select()
    .from(checklistItems)
    .where(
      and(eq(checklistItems.profileId, profileId), eq(checklistItems.programId, programId)),
    )
}

export async function updateChecklistItem(
  profileId: string,
  requirementId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE',
  notes?: string | null,
): Promise<ChecklistItem> {
  const [updated] = await db
    .update(checklistItems)
    .set({ status, notes, updatedAt: new Date() })
    .where(
      and(
        eq(checklistItems.profileId, profileId),
        eq(checklistItems.requirementId, requirementId),
      ),
    )
    .returning()

  if (!updated) throw new Error('Checklist item not found')
  return updated
}
