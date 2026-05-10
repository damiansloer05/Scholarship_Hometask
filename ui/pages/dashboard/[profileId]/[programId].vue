<script setup lang="ts">
import { useChecklistStore } from '~/stores/checklist'
import type { ChecklistStatus, RequirementType } from '~/types'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const profileId = route.params.profileId as string
const programId = route.params.programId as string

const checklistStore = useChecklistStore()

await checklistStore.initChecklist(profileId, programId)

useHead({ title: 'Readiness Dashboard — AdmissionsReady' })

const categoryLabels: Record<RequirementType, string> = {
  ACADEMICS: 'Academic Records',
  TEST_SCORES: 'Test Scores',
  DOCUMENTS: 'Documents',
  RECOMMENDATIONS: 'Recommendations',
  ESSAYS: 'Essays & Statements',
  FINANCIAL: 'Financial',
}

const expandedNotes = ref<Set<string>>(new Set())

function toggleNotes(requirementId: string) {
  if (expandedNotes.value.has(requirementId)) {
    expandedNotes.value.delete(requirementId)
  } else {
    expandedNotes.value.add(requirementId)
  }
  expandedNotes.value = new Set(expandedNotes.value)
}

const noteTimers = new Map<string, ReturnType<typeof setTimeout>>()

function onNoteInput(requirementId: string, currentStatus: ChecklistStatus, value: string) {
  clearTimeout(noteTimers.get(requirementId))
  noteTimers.set(
    requirementId,
    setTimeout(() => {
      checklistStore.updateItem(profileId, requirementId, currentStatus, value)
    }, 600),
  )
}

async function toggleStatus(requirementId: string, current: ChecklistStatus) {
  const next: ChecklistStatus =
    current === 'PENDING' ? 'IN_PROGRESS' : current === 'IN_PROGRESS' ? 'COMPLETE' : 'PENDING'
  const item = checklistStore.items.find((i) => i.requirementId === requirementId)
  await checklistStore.updateItem(profileId, requirementId, next, item?.notes)
}

async function markComplete(requirementId: string) {
  const item = checklistStore.items.find((i) => i.requirementId === requirementId)
  await checklistStore.updateItem(profileId, requirementId, 'COMPLETE', item?.notes)
}

const statusConfig: Record<ChecklistStatus, { label: string; classes: string; icon: string }> = {
  PENDING: { label: 'Not started', classes: 'bg-gray-100 text-gray-600', icon: '○' },
  IN_PROGRESS: { label: 'In progress', classes: 'bg-yellow-100 text-yellow-700', icon: '◑' },
  COMPLETE: { label: 'Complete', classes: 'bg-green-100 text-green-700', icon: '✓' },
}

const timelineStatusConfig = {
  UPCOMING: { classes: 'border-gray-300 bg-white', dot: 'bg-gray-300', text: 'text-gray-500' },
  DUE_SOON: { classes: 'border-yellow-300 bg-yellow-50', dot: 'bg-yellow-400', text: 'text-yellow-700' },
  OVERDUE: { classes: 'border-red-300 bg-red-50', dot: 'bg-red-500', text: 'text-red-700' },
  COMPLETE: { classes: 'border-green-300 bg-green-50', dot: 'bg-green-500', text: 'text-green-700' },
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div v-if="checklistStore.loading" class="flex items-center justify-center py-24">
      <svg class="h-8 w-8 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>

    <div v-else-if="checklistStore.error" class="card p-8 text-center">
      <p class="text-red-600">{{ checklistStore.error }}</p>
      <button class="btn-secondary mt-4" @click="checklistStore.initChecklist(profileId, programId)">Retry</button>
    </div>

    <template v-else>
      <div class="mb-8 flex items-center justify-between">
        <div>
          <NuxtLink to="/programs" class="text-sm text-gray-500 hover:text-gray-700">← Programs</NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900 mt-1">Readiness Dashboard</h1>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="card p-6 flex flex-col items-center justify-center text-center">
              <p class="text-sm font-medium text-gray-500 mb-4">Readiness Score</p>
              <div class="relative h-32 w-32">
                <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    :stroke="checklistStore.readiness!.readinessScore >= 80 ? '#22c55e' : checklistStore.readiness!.readinessScore >= 50 ? '#f59e0b' : '#3b82f6'"
                    stroke-width="8"
                    stroke-linecap="round"
                    stroke-dasharray="283"
                    :stroke-dashoffset="283 - (283 * checklistStore.readiness!.readinessScore) / 100"
                    style="transition: stroke-dashoffset 0.6s ease"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-3xl font-bold text-gray-900">{{ checklistStore.readiness!.readinessScore }}%</span>
                </div>
              </div>
              <p class="mt-4 text-sm text-gray-600">
                {{ checklistStore.readiness!.completedRequired }} of
                {{ checklistStore.readiness!.totalRequired }} required items complete
              </p>
            </div>

            <div class="card p-6">
              <div class="flex items-center gap-2 mb-3">
                <span class="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                <p class="text-sm font-semibold text-gray-900">Still needed</p>
              </div>
              <div v-if="checklistStore.readiness!.missingRequirements.length === 0" class="text-center py-4">
                <p class="text-green-600 font-medium text-sm">All requirements complete! 🎉</p>
              </div>
              <ul v-else class="space-y-2">
                <li
                  v-for="req in checklistStore.readiness!.missingRequirements.slice(0, 6)"
                  :key="req.id"
                  class="flex items-center gap-2 text-sm"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <span class="text-gray-700 truncate">{{ req.title }}</span>
                  <span v-if="!req.required" class="text-gray-400 text-xs shrink-0">(opt)</span>
                </li>
                <li v-if="checklistStore.readiness!.missingRequirements.length > 6" class="text-xs text-gray-400 pl-3.5">
                  +{{ checklistStore.readiness!.missingRequirements.length - 6 }} more
                </li>
              </ul>
            </div>
          </div>

          <div v-for="(items, category) in checklistStore.itemsByCategory" :key="category" class="card overflow-hidden">
            <div class="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 class="text-sm font-semibold text-gray-700">
                {{ categoryLabels[category as RequirementType] }}
              </h3>
              <span class="text-xs text-gray-400">
                {{ items.filter(i => i.status === 'COMPLETE').length }}/{{ items.length }} done
              </span>
            </div>
            <ul class="divide-y divide-gray-100">
              <li v-for="item in items" :key="item.id" class="px-5 py-4">
                <div class="flex items-start gap-4">
                  <button
                    class="mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                    :class="item.status === 'COMPLETE' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-brand-400'"
                    @click="markComplete(item.requirementId)"
                    :title="item.status === 'COMPLETE' ? 'Marked complete' : 'Mark as complete'"
                  >
                    <svg v-if="item.status === 'COMPLETE'" class="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M1 6l4 4L11 2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
                    </svg>
                  </button>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="text-sm font-medium"
                        :class="item.status === 'COMPLETE' ? 'line-through text-gray-400' : 'text-gray-900'"
                      >{{ item.requirement.title }}</span>
                      <span v-if="!item.requirement.required" class="badge bg-gray-100 text-gray-400">Optional</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5">{{ item.requirement.description }}</p>
                    <p class="text-xs text-gray-400 mt-1">Due: {{ item.dueDate }}</p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      :class="['badge cursor-pointer hover:opacity-80 transition-opacity', statusConfig[item.status].classes]"
                      @click="toggleStatus(item.requirementId, item.status)"
                      :title="`Click to advance status (${statusConfig[item.status].label})`"
                    >
                      {{ statusConfig[item.status].icon }} {{ statusConfig[item.status].label }}
                    </button>

                    <button
                      class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                      :class="expandedNotes.has(item.requirementId) ? 'text-brand-500' : ''"
                      :title="expandedNotes.has(item.requirementId) ? 'Hide notes' : 'Add notes'"
                      @click="toggleNotes(item.requirementId)"
                    >
                      <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M2 3h12M2 6h12M2 9h7" stroke-linecap="round" />
                        <path d="M10 11.5h4m-2-2v4" stroke-linecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div v-if="expandedNotes.has(item.requirementId)" class="mt-3 ml-9">
                  <textarea
                    class="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 resize-none transition"
                    rows="3"
                    placeholder="Add a note…"
                    :value="item.notes ?? ''"
                    @input="onNoteInput(item.requirementId, item.status, ($event.target as HTMLTextAreaElement).value)"
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="space-y-4">
          <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wide">Timeline</h2>
          <div class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
            <div class="space-y-3">
              <div
                v-for="event in checklistStore.timeline"
                :key="event.id"
                :class="['relative pl-10 pr-4 py-3 rounded-lg border text-sm', timelineStatusConfig[event.status].classes]"
              >
                <span
                  :class="['absolute left-3 top-4 h-2.5 w-2.5 rounded-full -translate-x-1/2', timelineStatusConfig[event.status].dot]"
                />
                <p class="font-medium text-gray-900 leading-snug">{{ event.title }}</p>
                <p :class="['text-xs mt-0.5', timelineStatusConfig[event.status].text]">
                  {{ event.date }}
                  <span v-if="event.status !== 'COMPLETE'">
                    · {{ event.daysUntilDue > 0 ? `${event.daysUntilDue}d left` : `${Math.abs(event.daysUntilDue)}d overdue` }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
