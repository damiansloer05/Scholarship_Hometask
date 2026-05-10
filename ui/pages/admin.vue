<script setup lang="ts">
import { useProfileStore } from '~/stores/profile'
import { GET_ADMIN_STATS_QUERY } from '~/composables/useGqlQueries'

definePageMeta({ title: 'Admin Dashboard — AdmissionsReady', middleware: 'admin' })

const profileStore = useProfileStore()

interface ChecklistSummary {
  programId: string
  programName: string
  totalItems: number
  completedItems: number
  pendingItems: number
  inProgressItems: number
  readinessScore: number
  lastActivity: string | null
}

interface StudentSummary {
  overallScore: number
  profile: { id: string; name: string; email: string; educationLevel: string; targetTerm: string }
  checklists: ChecklistSummary[]
}

interface AdminStats {
  totalStudents: number
  totalChecklists: number
  averageScore: number
  completedItemsTotal: number
  inProgressItemsTotal: number
  pendingItemsTotal: number
  scoreDistribution: number[]
  studentSummaries: StudentSummary[]
}

const { gql } = useGraphQL()
const { data, pending, error } = await useAsyncData('adminStats', () =>
  gql<{ getAdminStats: AdminStats }>(GET_ADMIN_STATS_QUERY),
)

const stats = computed(() => data.value?.getAdminStats ?? null)

const totalItems = computed(() => {
  if (!stats.value) return 0
  return stats.value.completedItemsTotal + stats.value.inProgressItemsTotal + stats.value.pendingItemsTotal
})

const completionRate = computed(() => {
  const t = totalItems.value
  if (!stats.value || t === 0) return 0
  return Math.round((stats.value.completedItemsTotal / t) * 100)
})

const BAR_MAX_HEIGHT = 80
const scoreLabels = ['0–20', '20–40', '40–60', '60–80', '80–100']

const barHeights = computed(() => {
  const dist = stats.value?.scoreDistribution ?? [0, 0, 0, 0, 0]
  const max = Math.max(...dist, 1)
  return dist.map((v) => Math.round((v / max) * BAR_MAX_HEIGHT))
})

const statusTotal = computed(() => totalItems.value || 1)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">Student progress and application readiness overview.</p>
    </div>

    <div v-if="pending" class="flex items-center justify-center py-24 text-gray-400 text-sm">
      Loading…
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-50 border border-red-200 p-6 text-sm text-red-700">
      Failed to load admin stats. Make sure you're signed in as admin@edtech.com.
    </div>

    <template v-else-if="stats">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div class="card p-5">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Total Students</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ stats.totalStudents }}</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Active Checklists</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ stats.totalChecklists }}</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Avg. Readiness</p>
          <p class="mt-2 text-3xl font-bold text-brand-600">{{ stats.averageScore }}%</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Item Completion</p>
          <p class="mt-2 text-3xl font-bold text-green-600">{{ completionRate }}%</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <div class="card p-6">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Score Distribution</h2>
          <svg viewBox="0 0 260 100" class="w-full" aria-hidden="true">
            <g v-for="(h, i) in barHeights" :key="i">
              <rect
                :x="i * 52 + 4"
                :y="BAR_MAX_HEIGHT - h + 2"
                width="44"
                :height="h"
                rx="3"
                class="fill-brand-500"
              />
              <text
                :x="i * 52 + 26"
                y="96"
                text-anchor="middle"
                class="fill-gray-400"
                font-size="7"
              >{{ scoreLabels[i] }}</text>
              <text
                v-if="stats.scoreDistribution[i] > 0"
                :x="i * 52 + 26"
                :y="BAR_MAX_HEIGHT - h"
                text-anchor="middle"
                class="fill-gray-600"
                font-size="7"
              >{{ stats.scoreDistribution[i] }}</text>
            </g>
          </svg>
          <p class="mt-2 text-xs text-center text-gray-400">Readiness score buckets (%)</p>
        </div>

        <div class="card p-6">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Item Status Breakdown</h2>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>Completed</span>
                <span>{{ stats.completedItemsTotal }} items</span>
              </div>
              <div class="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  class="h-full rounded-full bg-green-500 transition-all"
                  :style="{ width: `${(stats.completedItemsTotal / statusTotal) * 100}%` }"
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>In Progress</span>
                <span>{{ stats.inProgressItemsTotal }} items</span>
              </div>
              <div class="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  class="h-full rounded-full bg-yellow-400 transition-all"
                  :style="{ width: `${(stats.inProgressItemsTotal / statusTotal) * 100}%` }"
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>Pending</span>
                <span>{{ stats.pendingItemsTotal }} items</span>
              </div>
              <div class="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gray-300 transition-all"
                  :style="{ width: `${(stats.pendingItemsTotal / statusTotal) * 100}%` }"
                />
              </div>
            </div>
          </div>
          <p class="mt-4 text-xs text-gray-400">Total: {{ totalItems }} checklist items across all students</p>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Student Progress</h2>
        </div>

        <div v-if="stats.studentSummaries.length === 0" class="px-6 py-10 text-sm text-gray-400 text-center">
          No students have signed up yet.
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="s in stats.studentSummaries"
            :key="s.profile.id"
            class="px-6 py-4"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ s.profile.name }}</p>
                <p class="text-xs text-gray-400">{{ s.profile.email }} · {{ s.profile.targetTerm }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-sm font-bold text-brand-600">{{ s.overallScore }}%</span>
                <span class="text-xs text-gray-400">overall</span>
              </div>
            </div>

            <div v-if="s.checklists.length > 0" class="space-y-2">
              <div v-for="c in s.checklists" :key="c.programId" class="flex items-center gap-3">
                <span class="w-40 shrink-0 text-xs text-gray-500 truncate">{{ c.programName }}</span>
                <div class="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-brand-500 transition-all"
                    :style="{ width: `${c.readinessScore}%` }"
                  />
                </div>
                <span class="w-10 shrink-0 text-right text-xs text-gray-500">{{ c.readinessScore }}%</span>
                <span class="hidden sm:block w-24 shrink-0 text-xs text-gray-400">
                  {{ c.completedItems }}/{{ c.totalItems }} done
                </span>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400">No checklists started yet.</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
