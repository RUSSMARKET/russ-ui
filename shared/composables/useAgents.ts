import { computed } from 'vue'
import { useAgentsStore, type Agent } from '@/stores/agents'

export function useAgents() {
  const agentsStore = useAgentsStore()

  const agents = computed(() => agentsStore.agents)
  const isLoading = computed(() => agentsStore.isLoading)

  const loadAgents = async (projectId?: number, force = false) => {
    return await agentsStore.fetchAgents(projectId, force)
  }

  const getAgentsByProject = (projectId?: number): Agent[] => {
    return agentsStore.getAgentsByProject(projectId)
  }

  const getAgentsByProjectAndPoint = (projectId?: number, pointId?: number): Agent[] => {
    return agentsStore.getAgentsByProjectAndPoint(projectId, pointId)
  }

  const getAgentById = (agentId: number): Agent | undefined => {
    return agentsStore.getAgentById(agentId)
  }

  const clearCache = (projectId?: number) => {
    agentsStore.clearCache(projectId)
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
