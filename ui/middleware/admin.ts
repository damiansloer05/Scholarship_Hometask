import { useProfileStore } from '~/stores/profile'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const profileStore = useProfileStore()
  if (!profileStore.token || profileStore.profile?.email !== 'admin@edtech.com') {
    return navigateTo('/')
  }
})
