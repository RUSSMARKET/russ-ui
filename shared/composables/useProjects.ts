import { computed, ref } from 'vue'

export interface Project {
  id: number
  name: string
  [key: string]: any
}

export interface Point {
  id: number
  name: string
  project_id: number
  [key: string]: any
}

let projectsStore: any = null

export const setProjectsStore = (store: any) => {
  projectsStore = store
}

export function useProjects() {
  const projects = computed(() => projectsStore?.projects || ref([]).value)
  const points = computed(() => projectsStore?.points || ref([]).value)
  const isLoading = computed(() => projectsStore?.isLoading || ref(false).value)

  const loadProjects = async (force = false) => {
    if (projectsStore) {
      return await projectsStore.fetchProjects(force)
    }
    throw new Error('Projects store не установлен. Используйте setProjectsStore()')
  }

  const getPointsByProjectId = (projectId: number): Point[] => {
    if (projectsStore) {
      return projectsStore.getPointsByProjectId(projectId)
    }
    return []
  }

  const getProjectById = (projectId: number): Project | undefined => {
    if (projectsStore) {
      return projectsStore.getProjectById(projectId)
    }
    return undefined
  }

  const clearCache = () => {
    if (projectsStore) {
      projectsStore.clearCache()
    }
  }

  return {
    projects,
    points,
    isLoading,
    loadProjects,
    getPointsByProjectId,
    getProjectById,
    clearCache,
  }
}
