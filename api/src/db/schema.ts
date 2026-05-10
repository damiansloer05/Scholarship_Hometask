import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  real,
  integer,
  boolean,
  timestamp,
  date,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const educationLevelEnum = pgEnum('education_level', [
  'HIGH_SCHOOL',
  'ASSOCIATE',
  'BACHELOR',
  'MASTER',
])

export const degreeTypeEnum = pgEnum('degree_type', [
  'BACHELOR',
  'MASTER',
  'PHD',
  'CERTIFICATE',
])

export const requirementTypeEnum = pgEnum('requirement_type', [
  'ACADEMICS',
  'TEST_SCORES',
  'DOCUMENTS',
  'RECOMMENDATIONS',
  'ESSAYS',
  'FINANCIAL',
])

export const checklistStatusEnum = pgEnum('checklist_status', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETE',
])

export const studentProfiles = pgTable('student_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  educationLevel: educationLevelEnum('education_level').notNull(),
  gpa: real('gpa'),
  satScore: integer('sat_score'),
  actScore: integer('act_score'),
  greScore: integer('gre_score'),
  gmatScore: integer('gmat_score'),
  targetTerm: varchar('target_term', { length: 50 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  degreeType: degreeTypeEnum('degree_type').notNull(),
  applicationDeadline: date('application_deadline').notNull(),
  description: text('description').notNull(),
  department: varchar('department', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const requirements = pgTable('requirements', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  type: requirementTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  dueOffsetDays: integer('due_offset_days').notNull(),
  required: boolean('required').notNull().default(true),
  evidenceType: varchar('evidence_type', { length: 100 }).notNull(),
})

export const checklistItems = pgTable(
  'checklist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => studentProfiles.id, { onDelete: 'cascade' }),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    requirementId: uuid('requirement_id')
      .notNull()
      .references(() => requirements.id, { onDelete: 'cascade' }),
    status: checklistStatusEnum('status').notNull().default('PENDING'),
    dueDate: date('due_date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    profileReqUnique: uniqueIndex('checklist_items_profile_req_unique').on(
      table.profileId,
      table.requirementId,
    ),
  }),
)

export type StudentProfile = typeof studentProfiles.$inferSelect
export type NewStudentProfile = typeof studentProfiles.$inferInsert
export type Program = typeof programs.$inferSelect
export type Requirement = typeof requirements.$inferSelect
export type ChecklistItem = typeof checklistItems.$inferSelect
export type NewChecklistItem = typeof checklistItems.$inferInsert
