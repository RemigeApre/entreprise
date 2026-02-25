import { readUsers, readUser, createUser, updateUser, deleteUser } from '@directus/sdk'
import type { UserProfile } from '~/utils/types'

export function useUsers() {
  const { $directus } = useNuxtApp()

  const allFields = [
    'id', 'first_name', 'last_name', 'email', 'avatar',
    'role.id', 'role.name',
    'categorie.id', 'categorie.nom', 'categorie.couleur',
    'actif', 'type_contrat',
    'date_debut_contrat', 'date_fin_contrat', 'date_fin_periode_essai'
  ]

  async function getActiveUsers() {
    const users = await $directus.request(readUsers({
      filter: {
        actif: { _eq: true }
      },
      fields: allFields,
      sort: ['first_name', 'last_name'],
      limit: -1
    }))
    return users as unknown as UserProfile[]
  }

  async function getAllUsers() {
    const users = await $directus.request(readUsers({
      fields: allFields,
      sort: ['first_name', 'last_name'],
      limit: -1
    }))
    return users as unknown as UserProfile[]
  }

  async function getUserById(id: string) {
    const data = await $directus.request(readUser(id, {
      fields: allFields
    }))
    return data as unknown as UserProfile
  }

  async function createNewUser(data: {
    email: string
    password: string
    first_name?: string
    last_name?: string
    role?: string
    categorie?: string | null
    type_contrat?: string | null
    actif?: boolean
    date_debut_contrat?: string | null
    date_fin_contrat?: string | null
    date_fin_periode_essai?: string | null
  }) {
    return await $directus.request(createUser(data)) as unknown as UserProfile
  }

  async function updateExistingUser(id: string, data: Record<string, any>) {
    return await $directus.request(updateUser(id, data)) as unknown as UserProfile
  }

  async function removeUser(id: string) {
    await $directus.request(deleteUser(id))
  }

  return {
    getActiveUsers,
    getAllUsers,
    getUserById,
    createNewUser,
    updateExistingUser,
    removeUser
  }
}
