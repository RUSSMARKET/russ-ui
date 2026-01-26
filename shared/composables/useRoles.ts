import { computed } from 'vue'
import { User } from '@/entities'
import { useRolesStore } from '~/stores/roles'

export function useRoles() {
  const rolesStore = useRolesStore()

  const userRole = computed(() => {
    return User.getRoleString()
  })

  const isAdmin = computed(() => {
    return rolesStore.isAdmin(userRole.value)
  })

  const isSupportOrAdmin = computed(() => {
    return (
      userRole.value === rolesStore.ROLES.ADMIN ||
      userRole.value === rolesStore.ROLES.SUPPORT_HEAD ||
      userRole.value === rolesStore.ROLES.SUPPORT_MANAGER
    )
  })

  const isAgent = computed(() => {
    return rolesStore.isAgent(userRole.value)
  })

  const isNewUser = computed(() => {
    return rolesStore.isNewUser(userRole.value)
  })

  const isDirector = computed(() => {
    return rolesStore.isDirector(userRole.value)
  })

  const isAccountDirector = computed(() => {
    return rolesStore.isAccountDirector(userRole.value)
  })

  const isSupportHead = computed(() => {
    return rolesStore.isSupportHead(userRole.value)
  })

  const isSupportManager = computed(() => {
    return rolesStore.isSupportManager(userRole.value)
  })

  const isProjectHead = computed(() => {
    return rolesStore.isProjectHead(userRole.value)
  })

  const isRegionalHead = computed(() => {
    return rolesStore.isRegionalHead(userRole.value)
  })

  const isGroupHead = computed(() => {
    return rolesStore.isGroupHead(userRole.value)
  })

  const isEducationManager = computed(() => {
    return rolesStore.isEducationManager(userRole.value)
  })

  const isClient = computed(() => {
    return rolesStore.isClient(userRole.value)
  })

  const isRoleAbove = (otherRole: string | null) => {
    return rolesStore.isRoleAbove(userRole.value, otherRole)
  }

  const canBlockUser = (otherRole: string | null) => {
    return rolesStore.canBlockUser(userRole.value, otherRole)
  }

  const isAboveAgentRole = computed(() => {
    return rolesStore.isAboveAgentRole(userRole.value)
  })

  return {
    userRole,
    isAdmin,
    isSupportOrAdmin,
    isAgent,
    isNewUser,
    isDirector,
    isAccountDirector,
    isSupportHead,
    isSupportManager,
    isProjectHead,
    isRegionalHead,
    isGroupHead,
    isEducationManager,
    isClient,
    isRoleAbove,
    canBlockUser,
    isAboveAgentRole,
    rolesStore
  }
}
