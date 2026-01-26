import { computed } from 'vue'
import { useProjectsStore, type Project, type Point } from '@/stores/projects'

export function useProjects() {
  const projectsStore = useProjectsStore()

  const projects = computed(() => projectsStore.projects)
  const points = computed(() => projectsStore.points)
  const isLoading = computed(() => projectsStore.isLoading)

  const loadProjects = async (force = false) => {
    return await projectsStore.fetchProjects(force)
  }

  const getPointsByProjectId = (projectId: number): Point[] => {
    return projectsStore.getPointsByProjectId(projectId)
  }

  const getProjectById = (projectId: number): Project | undefined => {
    return projectsStore.getProjectById(projectId)
  }

  const clearCache = () => {
    projectsStore.clearCache()
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
