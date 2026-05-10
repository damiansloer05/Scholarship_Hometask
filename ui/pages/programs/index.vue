<script setup lang="ts">
import type { ProgramConnection, DegreeType } from '~/types'
import { LIST_PROGRAMS_QUERY } from '~/composables/useGqlQueries'

definePageMeta({ title: 'Programs — AdmissionsReady', middleware: 'auth' })

const { gql } = useGraphQL()

const search = ref('')
const degreeFilter = ref<DegreeType | ''>('')
const page = ref(1)
const limit = 9

const degreeOptions: { value: DegreeType | ''; label: string }[] = [
  { value: '', label: 'All degrees' },
  { value: 'BACHELOR', label: "Bachelor's" },
  { value: 'MASTER', label: "Master's" },
  { value: 'PHD', label: 'PhD' },
  { value: 'CERTIFICATE', label: 'Certificate' },
]

const { data, pending, refresh } = await useAsyncData(
  'programs',
  () =>
    gql<{ listPrograms: ProgramConnection }>(LIST_PROGRAMS_QUERY, {
      filters: {
        search: search.value || undefined,
        degreeType: degreeFilter.value || undefined,
      },
      page: page.value,
      limit,
    }),
  { watch: [search, degreeFilter, page] },
)

const programs = computed(() => data.value?.listPrograms.items ?? [])
const total = computed(() => data.value?.listPrograms.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / limit))

const degreeColors: Record<DegreeType, string> = {
  BACHELOR: 'bg-blue-100 text-blue-700',
  MASTER: 'bg-indigo-100 text-indigo-700',
  PHD: 'bg-purple-100 text-purple-700',
  CERTIFICATE: 'bg-green-100 text-green-700',
}

let searchTimer: ReturnType<typeof setTimeout>
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1 }, 350)
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Program Catalog</h1>
      <p class="mt-1 text-gray-600">Browse programs and start your readiness checklist.</p>
    </div>

    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          v-model="search"
          @input="onSearch"
          type="text"
          class="input-field pl-10"
          placeholder="Search programs or departments…"
        />
      </div>
      <select v-model="degreeFilter" class="input-field sm:w-48" @change="page = 1">
        <option v-for="opt in degreeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <p class="mb-4 text-sm text-gray-500">
      <span v-if="!pending">{{ total }} program{{ total !== 1 ? 's' : '' }} found</span>
      <span v-else>Loading…</span>
    </p>

    <div v-if="pending" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="card p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-2/3 mb-3" />
        <div class="h-3 bg-gray-100 rounded w-full mb-2" />
        <div class="h-3 bg-gray-100 rounded w-4/5" />
      </div>
    </div>

    <div v-else-if="programs.length === 0" class="text-center py-16 text-gray-500">
      No programs match your filters.
    </div>

    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="prog in programs"
        :key="prog.id"
        :to="`/programs/${prog.id}`"
        class="card p-6 hover:shadow-md hover:border-brand-300 transition-all group"
      >
        <div class="flex items-start justify-between mb-3">
          <span :class="['badge', degreeColors[prog.degreeType]]">{{ prog.degreeType.replace('_', ' ') }}</span>
          <span class="text-xs text-gray-400">Due {{ prog.applicationDeadline }}</span>
        </div>
        <h3 class="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors mb-1">
          {{ prog.name }}
        </h3>
        <p class="text-sm text-gray-500 mb-3">{{ prog.department }}</p>
        <p class="text-sm text-gray-600 line-clamp-2">{{ prog.description }}</p>
        <div class="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>{{ prog.requirements.length }} requirement{{ prog.requirements.length !== 1 ? 's' : '' }}</span>
          <span class="text-brand-600 font-medium group-hover:underline">View details →</span>
        </div>
      </NuxtLink>
    </div>

    <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center gap-2">
      <button
        class="btn-secondary py-2 px-3"
        :disabled="page <= 1"
        @click="page--"
      >← Prev</button>
      <span class="text-sm text-gray-600">Page {{ page }} of {{ totalPages }}</span>
      <button
        class="btn-secondary py-2 px-3"
        :disabled="page >= totalPages"
        @click="page++"
      >Next →</button>
    </div>
  </div>
</template>
