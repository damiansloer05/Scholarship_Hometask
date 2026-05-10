import { eq, and, ilike, or, count, ne } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { db } from '../db/index.js'
import { studentProfiles, programs, requirements, checklistItems } from '../db/schema.js'
import { getOrCreateChecklist } from '../services/checklist.js'
import { buildReadinessReport, buildTimeline } from '../services/readiness.js'
import { PaginationSchema } from '../utils/validation.js'
import type { Context } from '../context.js'

export const queryResolvers = {
  listPrograms: async (
    _: unknown,
    args: { filters?: { degreeType?: string; search?: string }; page?: number; limit?: number },
  ) => {
    const { page, limit } = PaginationSchema.parse({ page: args.page ?? 1, limit: args.limit ?? 12 })
    const offset = (page - 1) * limit

    let query = db.select().from(programs).$dynamic()
    let countQuery = db.select({ value: count() }).from(programs).$dynamic()

    const conditions = []
    if (args.filters?.degreeType) {
      conditions.push(eq(programs.degreeType, args.filters.degreeType as any))
    }
    if (args.filters?.search) {
      const term = `%${args.filters.search}%`
      conditions.push(or(ilike(programs.name, term), ilike(programs.department, term))!)
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
      countQuery = countQuery.where(and(...conditions))
    }

    const [items, [{ value: total }]] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery,
    ])

    return { items, total, page, limit }
  },

  getProgram: async (_: unknown, { id }: { id: string }) => {
    const [program] = await db.select().from(programs).where(eq(programs.id, id))
    return program ?? null
  },

  getProfile: async (_: unknown, { id }: { id: string }) => {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, id))
    return profile ?? null
  },

  getProfileByEmail: async (_: unknown, { email }: { email: string }) => {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(ilike(studentProfiles.email, email.trim()))
      .limit(1)
    return profile ?? null
  },

  getChecklist: async (
    _: unknown,
    { profileId, programId }: { profileId: string; programId: string },
  ) => {
    return getOrCreateChecklist(profileId, programId)
  },

  getReadiness: async (
    _: unknown,
    { profileId, programId }: { profileId: string; programId: string },
  ) => {
    const [checklist, reqs] = await Promise.all([
      getOrCreateChecklist(profileId, programId),
      db.select().from(requirements).where(eq(requirements.programId, programId)),
    ])
    if (reqs.length === 0) throw new GraphQLError('Program not found or has no requirements')
    return buildReadinessReport(checklist, reqs)
  },

  getTimeline: async (
    _: unknown,
    { profileId, programId }: { profileId: string; programId: string },
  ) => {
    const [checklist, reqs] = await Promise.all([
      getOrCreateChecklist(profileId, programId),
      db.select().from(requirements).where(eq(requirements.programId, programId)),
    ])
    return buildTimeline(checklist, reqs)
  },

  getAdminStats: async (_: unknown, __: unknown, ctx: Context) => {
    if (ctx.currentProfile?.email !== 'admin@edtech.com') {
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } })
    }
    const [allProfiles, allItems, allReqs, allPrograms] = await Promise.all([
      db.select().from(studentProfiles).where(ne(studentProfiles.email, 'admin@edtech.com')),
      db.select().from(checklistItems),
      db.select().from(requirements),
      db.select().from(programs),
    ])

    const reqMap = new Map(allReqs.map((r) => [r.id, r]))
    const programMap = new Map(allPrograms.map((p) => [p.id, p]))

    const itemsByProfile = new Map<string, typeof allItems>()
    for (const item of allItems) {
      const existing = itemsByProfile.get(item.profileId) ?? []
      existing.push(item)
      itemsByProfile.set(item.profileId, existing)
    }

    const scoreDistribution = [0, 0, 0, 0, 0]
    let totalScore = 0
    let scoredCount = 0

    const studentSummaries = allProfiles.map((profile) => {
      const profileItems = itemsByProfile.get(profile.id) ?? []

      const byProgram = new Map<string, typeof profileItems>()
      for (const item of profileItems) {
        const bucket = byProgram.get(item.programId) ?? []
        bucket.push(item)
        byProgram.set(item.programId, bucket)
      }

      const checklists = Array.from(byProgram.entries()).map(([programId, items]) => {
        const prog = programMap.get(programId)
        const reqs = allReqs.filter((r) => r.programId === programId)
        const required = reqs.filter((r) => r.required)
        const completedRequired = items.filter(
          (i) => i.status === 'COMPLETE' && reqMap.get(i.requirementId)?.required,
        ).length
        const score = required.length > 0 ? (completedRequired / required.length) * 100 : 0
        const lastItem = items
          .filter((i) => i.updatedAt)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
        return {
          programId,
          programName: prog?.name ?? programId,
          totalItems: items.length,
          completedItems: items.filter((i) => i.status === 'COMPLETE').length,
          pendingItems: items.filter((i) => i.status === 'PENDING').length,
          inProgressItems: items.filter((i) => i.status === 'IN_PROGRESS').length,
          readinessScore: Math.round(score),
          lastActivity: lastItem ? String(lastItem.updatedAt) : null,
        }
      })

      const overallScore =
        checklists.length > 0
          ? checklists.reduce((s, c) => s + c.readinessScore, 0) / checklists.length
          : 0

      const bucket = Math.min(4, Math.floor(overallScore / 20))
      scoreDistribution[bucket]++
      totalScore += overallScore
      scoredCount++

      return { profile, checklists, overallScore: Math.round(overallScore) }
    })

    const completedItemsTotal = allItems.filter((i) => i.status === 'COMPLETE').length
    const inProgressItemsTotal = allItems.filter((i) => i.status === 'IN_PROGRESS').length
    const pendingItemsTotal = allItems.filter((i) => i.status === 'PENDING').length
    const uniqueChecklists = new Set(allItems.map((i) => `${i.profileId}:${i.programId}`)).size

    return {
      totalStudents: allProfiles.length,
      totalChecklists: uniqueChecklists,
      averageScore: scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0,
      completedItemsTotal,
      inProgressItemsTotal,
      pendingItemsTotal,
      scoreDistribution,
      studentSummaries,
    }
  },
}

export const programFieldResolvers = {
  Program: {
    requirements: (parent: { id: string }, _: unknown, ctx: Context) => {
      return ctx.requirementsByProgramIdLoader.load(parent.id)
    },
  },

  ChecklistItem: {
    requirement: async (parent: { requirementId: string }, _: unknown, ctx: Context) => {
      const req = await ctx.requirementByIdLoader.load(parent.requirementId)
      if (!req) throw new GraphQLError(`Requirement ${parent.requirementId} not found`)
      return req
    },
  },

  StudentProfile: {
    testScores: (parent: {
      satScore: number | null
      actScore: number | null
      greScore: number | null
      gmatScore: number | null
    }) => ({
      sat: parent.satScore,
      act: parent.actScore,
      gre: parent.greScore,
      gmat: parent.gmatScore,
    }),
  },
}
