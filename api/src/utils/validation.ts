import { z } from 'zod'

export const ProfileInputSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  educationLevel: z.enum(['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER']),
  gpa: z.number().min(0).max(4.0).nullable().optional(),
  satScore: z.number().int().min(400).max(1600).nullable().optional(),
  actScore: z.number().int().min(1).max(36).nullable().optional(),
  greScore: z.number().int().min(260).max(340).nullable().optional(),
  gmatScore: z.number().int().min(200).max(800).nullable().optional(),
  targetTerm: z.string().min(2).max(50),
})

export const UpdateChecklistItemSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETE']),
  notes: z.string().max(2000).nullable().optional(),
})

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
})

export function formatZodError(err: z.ZodError): string {
  return err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
}
