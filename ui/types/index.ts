export type EducationLevel = 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER'
export type DegreeType = 'BACHELOR' | 'MASTER' | 'PHD' | 'CERTIFICATE'
export type RequirementType = 'ACADEMICS' | 'TEST_SCORES' | 'DOCUMENTS' | 'RECOMMENDATIONS' | 'ESSAYS' | 'FINANCIAL'
export type ChecklistStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE'
export type TimelineStatus = 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETE'

export interface TestScores {
  sat?: number | null
  act?: number | null
  gre?: number | null
  gmat?: number | null
}

export interface StudentProfile {
  id: string
  name: string
  email: string
  educationLevel: EducationLevel
  gpa?: number | null
  testScores?: TestScores | null
  targetTerm: string
  createdAt: string
  updatedAt: string
}

export interface Requirement {
  id: string
  programId: string
  type: RequirementType
  title: string
  description: string
  dueOffsetDays: number
  required: boolean
  evidenceType: string
}

export interface Program {
  id: string
  name: string
  degreeType: DegreeType
  applicationDeadline: string
  description: string
  department: string
  requirements: Requirement[]
}

export interface ProgramConnection {
  items: Program[]
  total: number
  page: number
  limit: number
}

export interface ChecklistItem {
  id: string
  requirementId: string
  requirement: Requirement
  status: ChecklistStatus
  dueDate: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface TimelineEvent {
  id: string
  title: string
  date: string
  status: TimelineStatus
  relatedRequirementId?: string | null
  daysUntilDue: number
}

export interface ReadinessReport {
  readinessScore: number
  totalRequired: number
  completedRequired: number
  missingRequirements: Requirement[]
  nextMilestones: TimelineEvent[]
}
