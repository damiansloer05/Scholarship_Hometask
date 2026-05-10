<script setup lang="ts">
import { useProfileStore } from '~/stores/profile'
import type { EducationLevel } from '~/types'

definePageMeta({ title: 'Get Started — AdmissionsReady' })

const router = useRouter()
const profileStore = useProfileStore()

if (profileStore.token) {
  await navigateTo(profileStore.profile?.email === 'admin@edtech.com' ? '/admin' : '/programs')
}

const mode = ref<'signin' | 'signup'>('signin')

const signInEmail = ref('')
const signInPassword = ref('')
const signInError = ref('')
const signingIn = ref(false)

async function signIn() {
  signInError.value = ''
  if (!signInEmail.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    signInError.value = 'Please enter a valid email address.'
    return
  }
  if (!signInPassword.value) {
    signInError.value = 'Please enter your password.'
    return
  }
  signingIn.value = true
  try {
    const found = await profileStore.loginWithEmail(signInEmail.value, signInPassword.value)
    if (found) {
      router.push(found.email === 'admin@edtech.com' ? '/admin' : '/programs')
    }
  } catch (err) {
    signInError.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
  } finally {
    signingIn.value = false
  }
}

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  educationLevel: '' as EducationLevel,
  gpa: '',
  satScore: '',
  actScore: '',
  greScore: '',
  gmatScore: '',
  targetTerm: '',
})

const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const apiError = ref('')

const educationOptions: { value: EducationLevel; label: string }[] = [
  { value: 'HIGH_SCHOOL', label: 'High School / GED' },
  { value: 'ASSOCIATE', label: "Associate's Degree" },
  { value: 'BACHELOR', label: "Bachelor's Degree" },
  { value: 'MASTER', label: "Master's Degree" },
]

const termOptions = [
  'Fall 2026', 'Spring 2027', 'Fall 2027', 'Spring 2028', 'Fall 2028',
]

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Valid email required'
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters'
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match'
  if (!form.educationLevel) errors.educationLevel = 'Please select your education level'
  if (!form.targetTerm) errors.targetTerm = 'Please select your target term'
  if (form.gpa && (Number(form.gpa) < 0 || Number(form.gpa) > 4.0))
    errors.gpa = 'GPA must be between 0 and 4.0'
  return Object.keys(errors).length === 0
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  apiError.value = ''

  try {
    await profileStore.createProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      educationLevel: form.educationLevel,
      gpa: form.gpa ? Number(form.gpa) : null,
      satScore: form.satScore ? Number(form.satScore) : null,
      actScore: form.actScore ? Number(form.actScore) : null,
      greScore: form.greScore ? Number(form.greScore) : null,
      gmatScore: form.gmatScore ? Number(form.gmatScore) : null,
      targetTerm: form.targetTerm,
    })
    router.push('/programs')
  } catch (err) {
    apiError.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
    <div class="mb-10 text-center">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Know exactly where you stand
      </h1>
      <p class="mt-3 text-lg text-gray-600">
        Track your application readiness across every program you're targeting.
      </p>
    </div>

    <div class="flex rounded-xl border border-gray-200 bg-white p-1 mb-6 gap-1">
      <button
        class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
        :class="mode === 'signin' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'"
        @click="mode = 'signin'"
      >
        Sign in
      </button>
      <button
        class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
        :class="mode === 'signup' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'"
        @click="mode = 'signup'"
      >
        Create profile
      </button>
    </div>

    <div v-if="mode === 'signin'" class="card p-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Welcome back</h2>
      <p class="text-sm text-gray-500 mb-6">Sign in with your email and password.</p>

      <form @submit.prevent="signIn" class="space-y-4" novalidate>
        <div>
          <label for="signin-email" class="label">Email address</label>
          <input
            id="signin-email"
            v-model="signInEmail"
            type="email"
            class="input-field"
            placeholder="jane@example.com"
            autofocus
            autocomplete="email"
          />
        </div>

        <div>
          <label for="signin-password" class="label">Password</label>
          <input
            id="signin-password"
            v-model="signInPassword"
            type="password"
            class="input-field"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <div v-if="signInError" class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {{ signInError }}
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="signingIn">
          <svg v-if="signingIn" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ signingIn ? 'Signing in…' : 'Sign in →' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        First time here?
        <button class="text-brand-600 font-medium hover:underline" @click="mode = 'signup'">Create a profile</button>
      </p>
    </div>

    <div v-else class="card p-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Your profile</h2>

      <form @submit.prevent="submit" class="space-y-6" novalidate>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="name" class="label">Full name *</label>
            <input id="name" v-model="form.name" type="text" class="input-field" placeholder="Jane Smith" autocomplete="name" />
            <p v-if="errors.name" class="mt-1 text-xs text-red-600">{{ errors.name }}</p>
          </div>
          <div>
            <label for="email" class="label">Email *</label>
            <input id="email" v-model="form.email" type="email" class="input-field" placeholder="jane@example.com" autocomplete="email" />
            <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="password" class="label">Password * <span class="text-gray-400 font-normal">(min 8 chars)</span></label>
            <input id="password" v-model="form.password" type="password" class="input-field" placeholder="••••••••" autocomplete="new-password" />
            <p v-if="errors.password" class="mt-1 text-xs text-red-600">{{ errors.password }}</p>
          </div>
          <div>
            <label for="confirmPassword" class="label">Confirm password *</label>
            <input id="confirmPassword" v-model="form.confirmPassword" type="password" class="input-field" placeholder="••••••••" autocomplete="new-password" />
            <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-600">{{ errors.confirmPassword }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="educationLevel" class="label">Highest education level *</label>
            <select id="educationLevel" v-model="form.educationLevel" class="input-field">
              <option value="" disabled>Select level…</option>
              <option v-for="opt in educationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <p v-if="errors.educationLevel" class="mt-1 text-xs text-red-600">{{ errors.educationLevel }}</p>
          </div>
          <div>
            <label for="targetTerm" class="label">Target entry term *</label>
            <select id="targetTerm" v-model="form.targetTerm" class="input-field">
              <option value="" disabled>Select term…</option>
              <option v-for="t in termOptions" :key="t" :value="t">{{ t }}</option>
            </select>
            <p v-if="errors.targetTerm" class="mt-1 text-xs text-red-600">{{ errors.targetTerm }}</p>
          </div>
        </div>

        <div>
          <label for="gpa" class="label">GPA <span class="text-gray-400 font-normal">(optional, 0–4.0)</span></label>
          <input id="gpa" v-model="form.gpa" type="number" step="0.01" min="0" max="4.0" class="input-field w-40" placeholder="3.8" />
          <p v-if="errors.gpa" class="mt-1 text-xs text-red-600">{{ errors.gpa }}</p>
        </div>

        <fieldset>
          <legend class="label">Test scores <span class="text-gray-400 font-normal">(optional — add any you have)</span></legend>
          <div class="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">SAT (400–1600)</label>
              <input v-model="form.satScore" type="number" min="400" max="1600" class="input-field" placeholder="1480" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">ACT (1–36)</label>
              <input v-model="form.actScore" type="number" min="1" max="36" class="input-field" placeholder="32" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">GRE (260–340)</label>
              <input v-model="form.greScore" type="number" min="260" max="340" class="input-field" placeholder="325" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">GMAT (200–800)</label>
              <input v-model="form.gmatScore" type="number" min="200" max="800" class="input-field" placeholder="720" />
            </div>
          </div>
        </fieldset>

        <div v-if="apiError" class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {{ apiError }}
        </div>

        <div class="flex items-center justify-between pt-2">
          <p class="text-xs text-gray-500">* Required fields</p>
          <button type="submit" class="btn-primary" :disabled="submitting">
            <svg v-if="submitting" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {{ submitting ? 'Creating…' : 'Continue to Programs →' }}
          </button>
        </div>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Already have a profile?
        <button class="text-brand-600 font-medium hover:underline" @click="mode = 'signin'">Sign in instead</button>
      </p>
    </div>
  </div>
</template>
