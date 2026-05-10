<script setup lang="ts">
import { useProfileStore } from '~/stores/profile'

const profileStore = useProfileStore()
const router = useRouter()

function signOut() {
  profileStore.clearProfile()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="border-b border-gray-200 bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <NuxtLink to="/" class="flex items-center gap-2">
            <svg class="h-8 w-8 text-brand-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
            <span class="text-lg font-bold text-gray-900">AdmissionsReady</span>
          </NuxtLink>

          <div class="flex items-center gap-4">
            <NuxtLink
              to="/programs"
              class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Programs
            </NuxtLink>

            <template v-if="profileStore.profileId">
              <NuxtLink
                v-if="profileStore.profile?.email === 'admin@edtech.com'"
                to="/admin"
                class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Admin Dashboard
              </NuxtLink>
              <span class="hidden sm:block text-sm text-gray-500">
                {{ profileStore.profile?.name ?? 'My Profile' }}
              </span>
              <button
                class="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                @click="signOut"
              >
                Sign out
              </button>
            </template>

            <NuxtLink
              v-else
              to="/"
              class="btn-primary text-xs py-2 px-3"
            >
              Get Started
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <NuxtPage />
    </main>

    <footer class="mt-auto border-t border-gray-200 bg-white py-8">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        &copy; {{ new Date().getFullYear() }} AdmissionsReady. Built for ScholarshipOwl.
      </div>
    </footer>
  </div>
</template>
