import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { programs, requirements, studentProfiles } from './schema.js'

const PROGRAMS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'MS Computer Science',
    degreeType: 'MASTER' as const,
    applicationDeadline: '2026-12-01',
    description:
      'A rigorous graduate program covering algorithms, machine learning, distributed systems, and software engineering at scale.',
    department: 'School of Engineering',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'MBA — Full-Time',
    degreeType: 'MASTER' as const,
    applicationDeadline: '2027-01-15',
    description:
      'An immersive two-year business program developing leadership, strategy, and analytical skills for global markets.',
    department: 'Business School',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'BS Computer Science',
    degreeType: 'BACHELOR' as const,
    applicationDeadline: '2027-01-01',
    description:
      'An undergraduate degree blending theoretical foundations with hands-on systems and software development experience.',
    department: 'School of Engineering',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    name: 'PhD Data Science',
    degreeType: 'PHD' as const,
    applicationDeadline: '2026-11-15',
    description:
      'A research-intensive doctoral programme at the intersection of statistics, machine learning, and large-scale data systems.',
    department: 'Graduate School of Arts & Sciences',
  },
]

const REQUIREMENTS = [
  {
    id: 'b0000000-0000-0000-0001-000000000001',
    programId: 'a0000000-0000-0000-0000-000000000001',
    type: 'DOCUMENTS' as const,
    title: 'Official Transcripts',
    description: 'Sealed official transcripts from all post-secondary institutions attended.',
    dueOffsetDays: 90,
    required: true,
    evidenceType: 'Official sealed document',
  },
  {
    id: 'b0000000-0000-0000-0001-000000000002',
    programId: 'a0000000-0000-0000-0000-000000000001',
    type: 'TEST_SCORES' as const,
    title: 'GRE General Test',
    description: 'Official GRE scores (minimum Verbal 155, Quantitative 165 recommended).',
    dueOffsetDays: 60,
    required: true,
    evidenceType: 'ETS score report',
  },
  {
    id: 'b0000000-0000-0000-0001-000000000003',
    programId: 'a0000000-0000-0000-0000-000000000001',
    type: 'RECOMMENDATIONS' as const,
    title: 'Letters of Recommendation (×3)',
    description: 'Three letters from academic or professional referees familiar with your technical work.',
    dueOffsetDays: 45,
    required: true,
    evidenceType: 'Online submission by referee',
  },
  {
    id: 'b0000000-0000-0000-0001-000000000004',
    programId: 'a0000000-0000-0000-0000-000000000001',
    type: 'ESSAYS' as const,
    title: 'Statement of Purpose',
    description: 'A 1,000-word essay describing your research interests, background, and career goals.',
    dueOffsetDays: 30,
    required: true,
    evidenceType: 'PDF upload',
  },
  {
    id: 'b0000000-0000-0000-0001-000000000005',
    programId: 'a0000000-0000-0000-0000-000000000001',
    type: 'DOCUMENTS' as const,
    title: 'Resume / CV',
    description: 'Current CV highlighting academic achievements, research, and work experience.',
    dueOffsetDays: 30,
    required: true,
    evidenceType: 'PDF upload',
  },
  {
    id: 'b0000000-0000-0000-0001-000000000006',
    programId: 'a0000000-0000-0000-0000-000000000001',
    type: 'TEST_SCORES' as const,
    title: 'TOEFL / IELTS',
    description: 'English proficiency scores (TOEFL ≥ 100 or IELTS ≥ 7.0). Waived for native English speakers.',
    dueOffsetDays: 60,
    required: false,
    evidenceType: 'Official score report',
  },
  {
    id: 'b0000000-0000-0000-0002-000000000001',
    programId: 'a0000000-0000-0000-0000-000000000002',
    type: 'TEST_SCORES' as const,
    title: 'GMAT or GRE Score',
    description: 'GMAT (median 730) or GRE scores submitted through official channels.',
    dueOffsetDays: 90,
    required: true,
    evidenceType: 'Official score report',
  },
  {
    id: 'b0000000-0000-0000-0002-000000000002',
    programId: 'a0000000-0000-0000-0000-000000000002',
    type: 'DOCUMENTS' as const,
    title: 'Official Transcripts',
    description: 'Transcripts from all undergraduate and graduate institutions.',
    dueOffsetDays: 60,
    required: true,
    evidenceType: 'Official sealed document',
  },
  {
    id: 'b0000000-0000-0000-0002-000000000003',
    programId: 'a0000000-0000-0000-0000-000000000002',
    type: 'RECOMMENDATIONS' as const,
    title: 'Professional Recommendations (×2)',
    description: 'Two letters from current or former supervisors who can speak to your leadership.',
    dueOffsetDays: 45,
    required: true,
    evidenceType: 'Online submission by referee',
  },
  {
    id: 'b0000000-0000-0000-0002-000000000004',
    programId: 'a0000000-0000-0000-0000-000000000002',
    type: 'ESSAYS' as const,
    title: 'Goals Essay',
    description: 'Describe your career goals and how the MBA will help you achieve them (500 words).',
    dueOffsetDays: 30,
    required: true,
    evidenceType: 'Inline text entry',
  },
  {
    id: 'b0000000-0000-0000-0002-000000000005',
    programId: 'a0000000-0000-0000-0000-000000000002',
    type: 'ESSAYS' as const,
    title: 'Leadership Essay',
    description: 'Describe a situation where you demonstrated leadership under pressure (500 words).',
    dueOffsetDays: 30,
    required: true,
    evidenceType: 'Inline text entry',
  },
  {
    id: 'b0000000-0000-0000-0002-000000000006',
    programId: 'a0000000-0000-0000-0000-000000000002',
    type: 'DOCUMENTS' as const,
    title: 'Resume / CV',
    description: 'Professional resume (maximum 2 pages) emphasising impact and progression.',
    dueOffsetDays: 21,
    required: true,
    evidenceType: 'PDF upload',
  },
  {
    id: 'b0000000-0000-0000-0002-000000000007',
    programId: 'a0000000-0000-0000-0000-000000000002',
    type: 'DOCUMENTS' as const,
    title: 'Interview',
    description: 'Invitation-only interview with admissions staff or alumni (scheduled post-review).',
    dueOffsetDays: 14,
    required: false,
    evidenceType: 'Scheduled by admissions',
  },
  {
    id: 'b0000000-0000-0000-0003-000000000001',
    programId: 'a0000000-0000-0000-0000-000000000003',
    type: 'ACADEMICS' as const,
    title: 'High School Transcripts',
    description: 'Official transcripts from all high schools attended, including senior-year grades.',
    dueOffsetDays: 90,
    required: true,
    evidenceType: 'Official sealed document',
  },
  {
    id: 'b0000000-0000-0000-0003-000000000002',
    programId: 'a0000000-0000-0000-0000-000000000003',
    type: 'TEST_SCORES' as const,
    title: 'SAT or ACT Score',
    description: 'SAT (≥1500) or ACT (≥34) submitted by the application deadline.',
    dueOffsetDays: 60,
    required: true,
    evidenceType: 'Official score report',
  },
  {
    id: 'b0000000-0000-0000-0003-000000000003',
    programId: 'a0000000-0000-0000-0000-000000000003',
    type: 'RECOMMENDATIONS' as const,
    title: 'Teacher Recommendations (×2)',
    description: 'Two recommendations from STEM or English teachers who know your academic ability.',
    dueOffsetDays: 45,
    required: true,
    evidenceType: 'Online submission by referee',
  },
  {
    id: 'b0000000-0000-0000-0003-000000000004',
    programId: 'a0000000-0000-0000-0000-000000000003',
    type: 'RECOMMENDATIONS' as const,
    title: 'School Counselor Recommendation',
    description: 'A recommendation from your high school guidance counselor.',
    dueOffsetDays: 45,
    required: true,
    evidenceType: 'Online submission by counselor',
  },
  {
    id: 'b0000000-0000-0000-0003-000000000005',
    programId: 'a0000000-0000-0000-0000-000000000003',
    type: 'ESSAYS' as const,
    title: 'Personal Essay',
    description: 'Common App essay or school-specific personal statement (650 words).',
    dueOffsetDays: 30,
    required: true,
    evidenceType: 'Inline text entry',
  },
  {
    id: 'b0000000-0000-0000-0003-000000000006',
    programId: 'a0000000-0000-0000-0000-000000000003',
    type: 'DOCUMENTS' as const,
    title: 'Activities & Awards List',
    description: 'List of extracurricular activities, leadership roles, and awards (Common App format).',
    dueOffsetDays: 21,
    required: true,
    evidenceType: 'Inline form',
  },
  {
    id: 'b0000000-0000-0000-0004-000000000001',
    programId: 'a0000000-0000-0000-0000-000000000004',
    type: 'DOCUMENTS' as const,
    title: 'Official Transcripts',
    description: 'Transcripts from all undergraduate and graduate institutions attended.',
    dueOffsetDays: 90,
    required: true,
    evidenceType: 'Official sealed document',
  },
  {
    id: 'b0000000-0000-0000-0004-000000000002',
    programId: 'a0000000-0000-0000-0000-000000000004',
    type: 'TEST_SCORES' as const,
    title: 'GRE General Test',
    description: 'GRE scores; strong quantitative reasoning expected (≥167 recommended).',
    dueOffsetDays: 75,
    required: true,
    evidenceType: 'ETS score report',
  },
  {
    id: 'b0000000-0000-0000-0004-000000000003',
    programId: 'a0000000-0000-0000-0000-000000000004',
    type: 'RECOMMENDATIONS' as const,
    title: 'Letters of Recommendation (×3)',
    description: 'Three letters from faculty or research supervisors who can evaluate research potential.',
    dueOffsetDays: 60,
    required: true,
    evidenceType: 'Online submission by referee',
  },
  {
    id: 'b0000000-0000-0000-0004-000000000004',
    programId: 'a0000000-0000-0000-0000-000000000004',
    type: 'ESSAYS' as const,
    title: 'Research Statement',
    description: 'Describe your research interests, prior experience, and potential faculty advisors (1,500 words).',
    dueOffsetDays: 45,
    required: true,
    evidenceType: 'PDF upload',
  },
  {
    id: 'b0000000-0000-0000-0004-000000000005',
    programId: 'a0000000-0000-0000-0000-000000000004',
    type: 'DOCUMENTS' as const,
    title: 'Writing Sample',
    description: 'An academic paper or thesis chapter demonstrating research and writing ability.',
    dueOffsetDays: 45,
    required: true,
    evidenceType: 'PDF upload',
  },
  {
    id: 'b0000000-0000-0000-0004-000000000006',
    programId: 'a0000000-0000-0000-0000-000000000004',
    type: 'DOCUMENTS' as const,
    title: 'Resume / CV',
    description: 'Academic CV including publications, presentations, and research positions.',
    dueOffsetDays: 30,
    required: true,
    evidenceType: 'PDF upload',
  },
  {
    id: 'b0000000-0000-0000-0004-000000000007',
    programId: 'a0000000-0000-0000-0000-000000000004',
    type: 'ESSAYS' as const,
    title: 'Diversity Statement',
    description: 'Optional statement on how your background contributes to diversity in research (500 words).',
    dueOffsetDays: 30,
    required: false,
    evidenceType: 'PDF upload',
  },
]

async function seed() {
  const { Pool } = await import('pg')
  const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : new Pool({
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        database: process.env.DB_NAME ?? 'admissions',
        user: process.env.DB_USER ?? 'admissions_user',
        password: process.env.DB_PASSWORD,
      })
  const db = drizzle(pool)

  console.log('[seed] Inserting admin profile...')
  const adminPasswordHash = await bcrypt.hash('Admin@2025!', 12)
  await db
    .insert(studentProfiles)
    .values({
      id: 'ad000000-0000-0000-0000-000000000001',
      name: 'Admin',
      email: 'admin@edtech.com',
      educationLevel: 'MASTER',
      targetTerm: 'Fall 2026',
      passwordHash: adminPasswordHash,
    })
    .onConflictDoUpdate({
      target: studentProfiles.id,
      set: { passwordHash: adminPasswordHash },
    })

  console.log('[seed] Inserting programs...')
  await db.insert(programs).values(PROGRAMS).onConflictDoNothing()

  console.log('[seed] Inserting requirements...')
  await db.insert(requirements).values(REQUIREMENTS).onConflictDoNothing()

  console.log('[seed] Done.')
  await pool.end()
}

seed().catch((err) => {
  console.error('[seed] Seed failed:', err)
  process.exit(1)
})
