import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Project, ProjectTask, ProjectMember } from '~/utils/types'

export function useProjects() {
  const { $directus } = useNuxtApp()

  const projectFields = [
    'id', 'nom', 'description', 'statut', 'date_debut', 'date_fin', 'budget',
    'categorie.id', 'categorie.nom', 'categorie.couleur',
    'client.id', 'client.nom_entreprise',
    'membres.id', 'membres.utilisateur.id', 'membres.utilisateur.first_name',
    'membres.utilisateur.last_name', 'membres.utilisateur.avatar', 'membres.role_projet',
    'date_created', 'user_created'
  ]

  async function getAll() {
    return await $directus.request(readItems('projects', {
      fields: projectFields,
      sort: ['-date_created'],
      limit: -1
    })) as Project[]
  }

  async function getById(id: string) {
    return await $directus.request(readItem('projects', id, {
      fields: [
        ...projectFields,
        'taches.id', 'taches.titre', 'taches.description', 'taches.statut',
        'taches.priorite', 'taches.date_echeance', 'taches.ordre',
        'taches.assigne_a.id', 'taches.assigne_a.first_name', 'taches.assigne_a.last_name',
        'fichiers.id', 'fichiers.fichier', 'fichiers.description'
      ]
    })) as Project
  }

  async function create(data: Partial<Project>) {
    return await $directus.request(createItem('projects', data)) as Project
  }

  async function update(id: string, data: Partial<Project>) {
    return await $directus.request(updateItem('projects', id, data)) as Project
  }

  async function remove(id: string) {
    await $directus.request(deleteItem('projects', id))
  }

  async function addMember(data: { project: string, utilisateur: string, role_projet?: string }) {
    return await $directus.request(createItem('projects_members', data)) as ProjectMember
  }

  async function removeMember(id: number) {
    await $directus.request(deleteItem('projects_members', id as any))
  }

  async function addTask(data: Partial<ProjectTask>) {
    return await $directus.request(createItem('project_tasks', data)) as ProjectTask
  }

  async function updateTask(id: string, data: Partial<ProjectTask>) {
    return await $directus.request(updateItem('project_tasks', id, data)) as ProjectTask
  }

  async function deleteTask(id: string) {
    await $directus.request(deleteItem('project_tasks', id))
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    addMember,
    removeMember,
    addTask,
    updateTask,
    deleteTask
  }
}
