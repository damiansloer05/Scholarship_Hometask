import { defineStore } from 'pinia'
import type { StudentProfile } from '~/types'
import { CREATE_PROFILE_MUTATION, SIGN_IN_MUTATION } from '~/composables/useGqlQueries'

interface AuthPayload {
  token: string
  profile: StudentProfile
}

export const useProfileStore = defineStore('profile', () => {
  const storedId = import.meta.client ? localStorage.getItem('profileId') : null
  const storedToken = import.meta.client ? localStorage.getItem('authToken') : null

  const profile = ref<StudentProfile | null>(null)
  const profileId = ref<string | null>(storedId)
  const token = ref<string | null>(storedToken)

  function setAuth(payload: AuthPayload) {
    profile.value = payload.profile
    profileId.value = payload.profile.id
    token.value = payload.token
    if (import.meta.client) {
      localStorage.setItem('profileId', payload.profile.id)
      localStorage.setItem('authToken', payload.token)
    }
  }

  function setProfile(p: StudentProfile) {
    profile.value = p
    profileId.value = p.id
    if (import.meta.client) localStorage.setItem('profileId', p.id)
  }

  async function createProfile(input: Record<string, unknown>): Promise<StudentProfile> {
    const { gql } = useGraphQL()
    const data = await gql<{ createProfile: AuthPayload }>(CREATE_PROFILE_MUTATION, { input })
    setAuth(data.createProfile)
    return data.createProfile.profile
  }

  async function loginWithEmail(email: string, password: string): Promise<StudentProfile | null> {
    const { gql } = useGraphQL()
    try {
      const data = await gql<{ signIn: AuthPayload }>(SIGN_IN_MUTATION, { email: email.trim(), password })
      setAuth(data.signIn)
      return data.signIn.profile
    } catch (err) {
      throw err
    }
  }

  function clearProfile() {
    profile.value = null
    profileId.value = null
    token.value = null
    if (import.meta.client) {
      localStorage.removeItem('profileId')
      localStorage.removeItem('authToken')
    }
  }

  return { profile, profileId, token, setProfile, createProfile, loginWithEmail, clearProfile }
})
