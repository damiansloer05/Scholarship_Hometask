export const LIST_PROGRAMS_QUERY = /* GraphQL */ `
  query ListPrograms($filters: ProgramFilters, $page: Int, $limit: Int) {
    listPrograms(filters: $filters, page: $page, limit: $limit) {
      items {
        id name degreeType applicationDeadline description department
        requirements { id type title required }
      }
      total page limit
    }
  }
`

export const GET_PROGRAM_QUERY = /* GraphQL */ `
  query GetProgram($id: ID!) {
    getProgram(id: $id) {
      id name degreeType applicationDeadline description department
      requirements {
        id type title description dueOffsetDays required evidenceType
      }
    }
  }
`

export const CREATE_PROFILE_MUTATION = /* GraphQL */ `
  mutation CreateProfile($input: ProfileInput!) {
    createProfile(input: $input) {
      token
      profile { id name email educationLevel gpa targetTerm testScores { sat act gre gmat } }
    }
  }
`

export const SIGN_IN_MUTATION = /* GraphQL */ `
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      token
      profile { id name email educationLevel gpa targetTerm testScores { sat act gre gmat } }
    }
  }
`

export const CREATE_CHECKLIST_MUTATION = /* GraphQL */ `
  mutation CreateChecklist($profileId: ID!, $programId: ID!) {
    createChecklist(profileId: $profileId, programId: $programId) {
      id requirementId status dueDate notes updatedAt
      requirement { id type title description required evidenceType }
    }
  }
`

export const GET_CHECKLIST_QUERY = /* GraphQL */ `
  query GetChecklist($profileId: ID!, $programId: ID!) {
    getChecklist(profileId: $profileId, programId: $programId) {
      id requirementId status dueDate notes updatedAt
      requirement { id type title description required evidenceType }
    }
  }
`

export const GET_READINESS_QUERY = /* GraphQL */ `
  query GetReadiness($profileId: ID!, $programId: ID!) {
    getReadiness(profileId: $profileId, programId: $programId) {
      readinessScore totalRequired completedRequired
      missingRequirements { id type title description required }
      nextMilestones { id title date status daysUntilDue relatedRequirementId }
    }
  }
`

export const GET_TIMELINE_QUERY = /* GraphQL */ `
  query GetTimeline($profileId: ID!, $programId: ID!) {
    getTimeline(profileId: $profileId, programId: $programId) {
      id title date status daysUntilDue relatedRequirementId
    }
  }
`

export const GET_ADMIN_STATS_QUERY = /* GraphQL */ `
  query GetAdminStats {
    getAdminStats {
      totalStudents
      totalChecklists
      averageScore
      completedItemsTotal
      inProgressItemsTotal
      pendingItemsTotal
      scoreDistribution
      studentSummaries {
        overallScore
        profile { id name email educationLevel targetTerm }
        checklists {
          programId programName totalItems completedItems pendingItems inProgressItems readinessScore lastActivity
        }
      }
    }
  }
`

export const UPDATE_CHECKLIST_ITEM_MUTATION = /* GraphQL */ `
  mutation UpdateChecklistItem($profileId: ID!, $requirementId: ID!, $input: UpdateChecklistItemInput!) {
    updateChecklistItem(profileId: $profileId, requirementId: $requirementId, input: $input) {
      id requirementId status dueDate notes updatedAt
      requirement { id type title description required evidenceType }
    }
  }
`
