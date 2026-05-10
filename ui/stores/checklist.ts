import { defineStore } from 'pinia'
import type { ChecklistItem, ReadinessReport, TimelineEvent, ChecklistStatus, TimelineStatus } from '~/types'
import {
  GET_CHECKLIST_QUERY,
  GET_READINESS_QUERY,
  GET_TIMELINE_QUERY,
  CREATE_CHECKLIST_MUTATION,
  UPDATE_CHECKLIST_ITEM_MUTATION,
} from '~/composables/useGqlQueries'

export const useChecklistStore = defineStore('checklist', () => {
  const items = ref<ChecklistItem[]>([])
  const readiness = ref<ReadinessReport | null>(null)
  const timeline = ref<TimelineEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function initChecklist(profileId: string, programId: string) {
    const { gql } = useGraphQL()
    loading.value = true
    error.value = null

    try {
      const checklistData = await gql<{ getChecklist: ChecklistItem[] }>(
        GET_CHECKLIST_QUERY,
        { profileId, programId },
      )
      items.value = checklistData.getChecklist

      const [readinessData, timelineData] = await Promise.all([
        gql<{ getReadiness: ReadinessReport }>(GET_READINESS_QUERY, { profileId, programId }),
        gql<{ getTimeline: TimelineEvent[] }>(GET_TIMELINE_QUERY, { profileId, programId }),
      ])

      readiness.value = readinessData.getReadiness
      timeline.value = timelineData.getTimeline
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load checklist'
    } finally {
      loading.value = false
    }
  }

  async function createAndInit(profileId: string, programId: string) {
    const { gql } = useGraphQL()
    await gql<{ createChecklist: ChecklistItem[] }>(CREATE_CHECKLIST_MUTATION, {
      profileId,
      programId,
    })
    await initChecklist(profileId, programId)
  }

  async function updateItem(
    profileId: string,
    requirementId: string,
    status: ChecklistStatus,
    notes?: string | null,
  ) {
    const { gql } = useGraphQL()

    const item = items.value.find((i) => i.requirementId === requirementId)
    const previousStatus = item?.status
    const previousNotes = item?.notes

    if (item) {
      item.status = status
      if (notes !== undefined) item.notes = notes
    }

    try {
      const data = await gql<{ updateChecklistItem: ChecklistItem }>(
        UPDATE_CHECKLIST_ITEM_MUTATION,
        { profileId, requirementId, input: { status, notes } },
      )

      const idx = items.value.findIndex((i) => i.requirementId === requirementId)
      if (idx !== -1) items.value[idx] = data.updateChecklistItem

      recomputeReadiness()
      updateTimelineStatus(requirementId, status)
    } catch (err) {
      if (item && previousStatus) {
        item.status = previousStatus
        item.notes = previousNotes ?? null
      }
      error.value = err instanceof Error ? err.message : 'Failed to save changes'
    }
  }

  function recomputeReadiness() {
    if (!readiness.value) return
    const total = readiness.value.totalRequired
    const completed = items.value.filter(
      (i) => i.status === 'COMPLETE' && i.requirement.required,
    ).length

    readiness.value = {
      ...readiness.value,
      completedRequired: completed,
      readinessScore: total === 0 ? 0 : Math.round((completed / total) * 100),
      missingRequirements: items.value
        .filter((i) => i.status !== 'COMPLETE' && i.requirement.required)
        .map((i) => i.requirement),
    }
  }

  function updateTimelineStatus(requirementId: string, status: ChecklistStatus) {
    const event = timeline.value.find((e) => e.relatedRequirementId === requirementId)
    if (!event) return

    let newStatus: TimelineStatus
    if (status === 'COMPLETE') {
      newStatus = 'COMPLETE'
    } else if (event.daysUntilDue < 0) {
      newStatus = 'OVERDUE'
    } else if (event.daysUntilDue <= 14) {
      newStatus = 'DUE_SOON'
    } else {
      newStatus = 'UPCOMING'
    }
    event.status = newStatus
  }

  const itemsByCategory = computed(() => {
    const grouped: Record<string, ChecklistItem[]> = {}
    for (const item of items.value) {
      const type = item.requirement.type
      if (!grouped[type]) grouped[type] = []
      grouped[type].push(item)
    }
    return grouped
  })

  return {
    items,
    readiness,
    timeline,
    loading,
    error,
    itemsByCategory,
    initChecklist,
    createAndInit,
    updateItem,
  }
})
