import { useProfileStore } from '~/stores/profile'

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string; extensions?: { code?: string } }>
}

export const useGraphQL = () => {
  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl as string

  async function gql<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const profileStore = useProfileStore()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (profileStore.token) {
      headers['Authorization'] = `Bearer ${profileStore.token}`
    }

    const response = await $fetch<GraphQLResponse<T>>(apiUrl, {
      method: 'POST',
      headers,
      body: { query, variables },
    })

    if (response.errors?.length) {
      const first = response.errors[0]
      if (first.extensions?.code === 'UNAUTHENTICATED') {
        profileStore.clearProfile()
        await navigateTo('/')
      }
      throw new Error(response.errors.map((e) => e.message).join(', '))
    }

    if (!response.data) throw new Error('Empty response from API')
    return response.data
  }

  return { gql }
}
