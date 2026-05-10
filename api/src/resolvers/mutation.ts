import { eq, ilike } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { DatabaseError } from 'pg'
import { ZodError } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'
import { studentProfiles } from '../db/schema.js'
import { getOrCreateChecklist, updateChecklistItem } from '../services/checklist.js'
import { ProfileInputSchema, UpdateChecklistItemSchema, formatZodError } from '../utils/validation.js'
import { signToken } from '../utils/jwt.js'
import type { Context } from '../context.js'

const SALT_ROUNDS = 12

function requireAuth(ctx: Context): { id: string; email: string } {
  if (!ctx.currentProfile) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
  return ctx.currentProfile
}

export const mutationResolvers = {
  createProfile: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
    let parsed
    try {
      parsed = ProfileInputSchema.parse(input)
    } catch (err) {
      if (err instanceof ZodError) throw new GraphQLError(formatZodError(err))
      throw err
    }

    const { password, satScore, actScore, greScore, gmatScore, ...rest } = parsed
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    let profile
    try {
      ;[profile] = await db
        .insert(studentProfiles)
        .values({ ...rest, passwordHash, satScore, actScore, greScore, gmatScore })
        .returning()
    } catch (err) {
      if (err instanceof DatabaseError && err.code === '23505') {
        throw new GraphQLError('An account with this email already exists. Please sign in instead.')
      }
      throw err
    }

    return { token: signToken(profile.id, profile.email), profile }
  },

  signIn: async (_: unknown, { email, password }: { email: string; password: string }) => {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(ilike(studentProfiles.email, email.trim()))
      .limit(1)

    if (!profile || !profile.passwordHash) {
      throw new GraphQLError('Invalid email or password.')
    }

    const valid = await bcrypt.compare(password, profile.passwordHash)
    if (!valid) {
      throw new GraphQLError('Invalid email or password.')
    }

    return { token: signToken(profile.id, profile.email), profile }
  },

  updateProfile: async (
    _: unknown,
    { id, input }: { id: string; input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const caller = requireAuth(ctx)
    if (caller.id !== id) {
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } })
    }

    let parsed
    try {
      parsed = ProfileInputSchema.parse(input)
    } catch (err) {
      if (err instanceof ZodError) throw new GraphQLError(formatZodError(err))
      throw err
    }

    const { password, satScore, actScore, greScore, gmatScore, ...rest } = parsed
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const [updated] = await db
      .update(studentProfiles)
      .set({ ...rest, passwordHash, satScore, actScore, greScore, gmatScore, updatedAt: new Date() })
      .where(eq(studentProfiles.id, id))
      .returning()

    if (!updated) throw new GraphQLError('Profile not found')
    return updated
  },

  createChecklist: async (
    _: unknown,
    { profileId, programId }: { profileId: string; programId: string },
    ctx: Context,
  ) => {
    const caller = requireAuth(ctx)
    if (caller.id !== profileId) {
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } })
    }
    return getOrCreateChecklist(profileId, programId)
  },

  updateChecklistItem: async (
    _: unknown,
    {
      profileId,
      requirementId,
      input,
    }: { profileId: string; requirementId: string; input: Record<string, unknown> },
    ctx: Context,
  ) => {
    const caller = requireAuth(ctx)
    if (caller.id !== profileId) {
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } })
    }

    let parsed
    try {
      parsed = UpdateChecklistItemSchema.parse(input)
    } catch (err) {
      if (err instanceof ZodError) throw new GraphQLError(formatZodError(err))
      throw err
    }

    return updateChecklistItem(profileId, requirementId, parsed.status, parsed.notes)
  },
}
