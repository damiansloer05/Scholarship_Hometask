export const typeDefs = /* GraphQL */ `
  enum EducationLevel {
    HIGH_SCHOOL
    ASSOCIATE
    BACHELOR
    MASTER
  }

  enum DegreeType {
    BACHELOR
    MASTER
    PHD
    CERTIFICATE
  }

  enum RequirementType {
    ACADEMICS
    TEST_SCORES
    DOCUMENTS
    RECOMMENDATIONS
    ESSAYS
    FINANCIAL
  }

  enum ChecklistStatus {
    PENDING
    IN_PROGRESS
    COMPLETE
  }

  enum TimelineStatus {
    UPCOMING
    DUE_SOON
    OVERDUE
    COMPLETE
  }

  type TestScores {
    sat: Int
    act: Int
    gre: Int
    gmat: Int
  }

  type StudentProfile {
    id: ID!
    name: String!
    email: String!
    educationLevel: EducationLevel!
    gpa: Float
    testScores: TestScores
    targetTerm: String!
    createdAt: String!
    updatedAt: String!
  }

  type Requirement {
    id: ID!
    programId: ID!
    type: RequirementType!
    title: String!
    description: String!
    dueOffsetDays: Int!
    required: Boolean!
    evidenceType: String!
  }

  type Program {
    id: ID!
    name: String!
    degreeType: DegreeType!
    applicationDeadline: String!
    description: String!
    department: String!
    requirements: [Requirement!]!
  }

  type ProgramConnection {
    items: [Program!]!
    total: Int!
    page: Int!
    limit: Int!
  }

  type ChecklistItem {
    id: ID!
    requirementId: ID!
    requirement: Requirement!
    status: ChecklistStatus!
    dueDate: String!
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  type TimelineEvent {
    id: ID!
    title: String!
    date: String!
    status: TimelineStatus!
    relatedRequirementId: ID
    daysUntilDue: Int!
  }

  type ReadinessReport {
    readinessScore: Float!
    totalRequired: Int!
    completedRequired: Int!
    missingRequirements: [Requirement!]!
    nextMilestones: [TimelineEvent!]!
  }

  input ProgramFilters {
    degreeType: DegreeType
    search: String
  }

  input ProfileInput {
    name: String!
    email: String!
    password: String!
    educationLevel: EducationLevel!
    gpa: Float
    satScore: Int
    actScore: Int
    greScore: Int
    gmatScore: Int
    targetTerm: String!
  }

  input UpdateChecklistItemInput {
    status: ChecklistStatus!
    notes: String
  }

  type ChecklistSummary {
    programId: ID!
    programName: String!
    totalItems: Int!
    completedItems: Int!
    pendingItems: Int!
    inProgressItems: Int!
    readinessScore: Float!
    lastActivity: String
  }

  type StudentSummary {
    profile: StudentProfile!
    checklists: [ChecklistSummary!]!
    overallScore: Float!
  }

  type AdminStats {
    totalStudents: Int!
    totalChecklists: Int!
    averageScore: Float!
    completedItemsTotal: Int!
    inProgressItemsTotal: Int!
    pendingItemsTotal: Int!
    scoreDistribution: [Int!]!
    studentSummaries: [StudentSummary!]!
  }

  type Query {
    listPrograms(filters: ProgramFilters, page: Int, limit: Int): ProgramConnection!
    getProgram(id: ID!): Program
    getProfile(id: ID!): StudentProfile
    getProfileByEmail(email: String!): StudentProfile
    getChecklist(profileId: ID!, programId: ID!): [ChecklistItem!]!
    getReadiness(profileId: ID!, programId: ID!): ReadinessReport!
    getTimeline(profileId: ID!, programId: ID!): [TimelineEvent!]!
    getAdminStats: AdminStats!
  }

  type AuthPayload {
    token: String!
    profile: StudentProfile!
  }

  type Mutation {
    createProfile(input: ProfileInput!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
    updateProfile(id: ID!, input: ProfileInput!): StudentProfile!
    createChecklist(profileId: ID!, programId: ID!): [ChecklistItem!]!
    updateChecklistItem(
      profileId: ID!
      requirementId: ID!
      input: UpdateChecklistItemInput!
    ): ChecklistItem!
  }
`
