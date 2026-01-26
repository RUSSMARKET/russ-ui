import { computed, ref } from 'vue'

export interface Agent {
  id: number
  name: string
  [key: string]: any
}

let agentsStore: any = null

export const setAgentsStore = (store: any) => {
  agentsStore = store
}

export function useAgents() {
  const agents = computed(() => agentsStore?.agents || ref([]).value)
  const isLoading = computed(() => agentsStore?.isLoading || ref(false).value)

  const loadAgents = async (projectId?: number, force = false) => {
    if (agentsStore) {
      return await agentsStore.fetchAgents(projectId, force)
    }
    throw new Error('Agents store не установлен. Используйте setAgentsStore()')
  }

  const getAgentsByProject = (projectId?: number): Agent[] => {
    if (agentsStore) {
      return agentsStore.getAgentsByProject(projectId)
    }
    return []
  }

  const getAgentsByProjectAndPoint = (projectId?: number, pointId?: number): Agent[] => {
    if (agentsStore) {
      return agentsStore.getAgentsByProjectAndPoint(projectId, pointId)
    }
    return []
  }

  const getAgentById = (agentId: number): Agent | undefined => {
    if (agentsStore) {
      return agentsStore.getAgentById(agentId)
    }
    return undefined
  }

  const clearCache = (projectId?: number) => {
    if (agentsStore) {
      agentsStore.clearCache(projectId)
    }
  }

  return {
    agents,
    isLoading,
    loadAgents,
    getAgentsByProject,
    getAgentsByProjectAndPoint,
    getAgentById,
    clearCache,
  }
}
