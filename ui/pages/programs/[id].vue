<script setup lang="ts">
import type { Program, RequirementType } from '~/types'
import { GET_PROGRAM_QUERY, CREATE_CHECKLIST_MUTATION } from '~/composables/useGqlQueries'
import { useProfileStore } from '~/stores/profile'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { gql } = useGraphQL()
const profileStore = useProfileStore()

const { data, error } = await useAsyncData(`program-${route.params.id}`, () =>
  gql<{ getProgram: Program | null }>(GET_PROGRAM_QUERY, { id: route.params.id }),
)

const program = computed(() => data.value?.getProgram ?? null)

if (!program.value) {
  throw createError({ statusCode: 404, statusMessage: 'Program not found' })
}

useHead({ title: `${program.value?.name} — AdmissionsReady` })

const starting = ref(false)
const startError = ref('')

async function startChecklist() {
  if (!profileStore.profileId) {
    router.push('/')
    return
  }

  starting.value = true
  startError.value = ''

  try {
    await gql(CREATE_CHECKLIST_MUTATION, {
      profileId: profileStore.profileId,
      programId: program.value!.id,
    })
    router.push(`/dashboard/${profileStore.profileId}/${program.value!.id}`)
  } catch (err) {
    router.push(`/dashboard/${profileStore.profileId}/${program.value!.id}`)
  } finally {
    starting.value = false
  }
}

const categoryLabels: Record<RequirementType, string> = {
  ACADEMICS: 'Academic Records',
  TEST_SCORES: 'Test Scores',
  DOCUMENTS: 'Documents',
  RECOMMENDATIONS: 'Recommendations',
  ESSAYS: 'Essays & Statements',
  FINANCIAL: 'Financial',
}

const categoryColors: Record<RequirementType, string> = {
  ACADEMICS: 'bg-blue-50 border-blue-200 text-blue-700',
  TEST_SCORES: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  DOCUMENTS: 'bg-gray-50 border-gray-200 text-gray-700',
  RECOMMENDATIONS: 'bg-green-50 border-green-200 text-green-700',
  ESSAYS: 'bg-purple-50 border-purple-200 text-purple-700',
  FINANCIAL: 'bg-orange-50 border-orange-200 text-orange-700',
}

const degreeColors: Record<string, string> = {
  BACHELOR: 'bg-blue-100 text-blue-700',
  MASTER: 'bg-indigo-100 text-indigo-700',
  PHD: 'bg-purple-100 text-purple-700',
  CERTIFICATE: 'bg-green-100 text-green-700',
}

const grouped = computed(() => {
  const g: Partial<Record<RequirementType, typeof program.value.requirements>> = {}
  for (const req of program.value?.requirements ?? []) {
    if (!g[req.type]) g[req.type] = []
    g[req.type]!.push(req)
  }
  return g
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
    <NuxtLink to="/programs" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
      ← Back to catalog
    </NuxtLink>

    <div v-if="program">
      <div class="card p-8 mb-6">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span :class="['badge', degreeColors[program.degreeType]]">{{ program.degreeType }}</span>
          <span class="text-sm text-gray-500">{{ program.department }}</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ program.name }}</h1>
        <p class="text-gray-600 mb-6">{{ program.description }}</p>

        <div class="flex flex-wrap items-center gap-6 text-sm border-t border-gray-100 pt-4">
          <div>
            <span class="text-gray-500">Application deadline</span>
            <p class="font-semibold text-gray-900">{{ program.applicationDeadline }}</p>
          </div>
          <div>
            <span class="text-gray-500">Requirements</span>
            <p class="font-semibold text-gray-900">{{ program.requirements.length }} total</p>
          </div>
          <div>
            <span class="text-gray-500">Required</span>
            <p class="font-semibold text-gray-900">{{ program.requirements.filter(r => r.required).length }} mandatory</p>
          </div>
        </div>
      </div>

      <div class="mb-8 space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Requirements breakdown</h2>
        <div v-for="(reqs, type) in grouped" :key="type" class="card overflow-hidden">
          <div :class="['px-5 py-3 border-b text-sm font-medium', categoryColors[type as RequirementType]]">
            {{ categoryLabels[type as RequirementType] }} ({{ reqs!.length }})
          </div>
          <ul class="divide-y divide-gray-100">
            <li v-for="req in reqs" :key="req.id" class="px-5 py-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="font-medium text-gray-900 text-sm">{{ req.title }}</span>
                    <span v-if="!req.required" class="badge bg-gray-100 text-gray-500">Optional</span>
                  </div>
                  <p class="text-sm text-gray-500">{{ req.description }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-xs text-gray-400">Due</p>
                  <p class="text-xs font-medium text-gray-700">{{ req.dueOffsetDays }}d before deadline</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="card p-6 bg-brand-50 border-brand-200">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 class="font-semibold text-gray-900">Ready to track your progress?</h3>
            <p class="text-sm text-gray-600 mt-0.5">
              {{ profileStore.profileId ? 'Start your personalised checklist for this program.' : 'Create your profile first to generate a checklist.' }}
            </p>
          </div>
          <button class="btn-primary shrink-0" :disabled="starting" @click="startChecklist">
            {{ starting ? 'Setting up…' : profileStore.profileId ? 'Start My Checklist →' : 'Create Profile First →' }}
          </button>
        </div>
        <p v-if="startError" class="mt-2 text-sm text-red-600">{{ startError }}</p>
      </div>
    </div>
  </div>
</template>
