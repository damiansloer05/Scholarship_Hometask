import DataLoader from 'dataloader'
import { inArray } from 'drizzle-orm'
import { db } from './db/index.js'
import { requirements } from './db/schema.js'
import type { Requirement } from './db/schema.js'
import { verifyToken } from './utils/jwt.js'

export function createContext(authHeader?: string | null) {
  const requirementByIdLoader = new DataLoader<string, Requirement | null>(async (ids) => {
    const reqs = await db
      .select()
      .from(requirements)
      .where(inArray(requirements.id, [...ids]))
    const map = new Map(reqs.map((r) => [r.id, r]))
    return ids.map((id) => map.get(id) ?? null)
  })

  const requirementsByProgramIdLoader = new DataLoader<string, Requirement[]>(
    async (programIds) => {
      const reqs = await db
        .select()
        .from(requirements)
        .where(inArray(requirements.programId, [...programIds]))
      return programIds.map((pid) => reqs.filter((r) => r.programId === pid))
    },
  )

  let currentProfile: { id: string; email: string } | null = null
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    if (payload) currentProfile = { id: payload.sub, email: payload.email }
  }

  return { requirementByIdLoader, requirementsByProgramIdLoader, currentProfile }
}

export type Context = ReturnType<typeof createContext> & { requestId: string }
