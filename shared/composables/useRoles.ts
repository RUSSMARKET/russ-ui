import { computed } from 'vue'

let rolesStore: any = null
let getRoleStringFn: (() => string | null) | null = null

export const setRolesStore = (store: any) => {
  rolesStore = store
}

export const setGetRoleString = (fn: () => string | null) => {
  getRoleStringFn = fn
}

const getRoleString = (): string | null => {
  if (getRoleStringFn) {
    return getRoleStringFn()
  }
  // Fallback на localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user_role_string')
  }
  return null
}

export function useRoles() {
  const userRole = computed(() => {
    return getRoleString()
  })

  const isAdmin = computed(() => {
    if (rolesStore) {
      return rolesStore.isAdmin(userRole.value)
    }
    return false
  })

  const isSupportOrAdmin = computed(() => {
    if (rolesStore) {
      return (
        userRole.value === rolesStore.ROLES.ADMIN ||
        userRole.value === rolesStore.ROLES.SUPPORT_HEAD ||
        userRole.value === rolesStore.ROLES.SUPPORT_MANAGER
      )
    }
    return false
  })

  const isAgent = computed(() => {
    if (rolesStore) {
      return rolesStore.isAgent(userRole.value)
    }
    return false
  })

  const isNewUser = computed(() => {
    if (rolesStore) {
      return rolesStore.isNewUser(userRole.value)
    }
    return false
  })

  const isDirector = computed(() => {
    if (rolesStore) {
      return rolesStore.isDirector(userRole.value)
    }
    return false
  })

  const isAccountDirector = computed(() => {
    if (rolesStore) {
      return rolesStore.isAccountDirector(userRole.value)
    }
    return false
  })

  const isSupportHead = computed(() => {
    if (rolesStore) {
      return rolesStore.isSupportHead(userRole.value)
    }
    return false
  })

  const isSupportManager = computed(() => {
    if (rolesStore) {
      return rolesStore.isSupportManager(userRole.value)
    }
    return false
  })

  const isProjectHead = computed(() => {
    if (rolesStore) {
      return rolesStore.isProjectHead(userRole.value)
    }
    return false
  })

  const isRegionalHead = computed(() => {
    if (rolesStore) {
      return rolesStore.isRegionalHead(userRole.value)
    }
    return false
  })

  const isGroupHead = computed(() => {
    if (rolesStore) {
      return rolesStore.isGroupHead(userRole.value)
    }
    return false
  })

  const isEducationManager = computed(() => {
    if (rolesStore) {
      return rolesStore.isEducationManager(userRole.value)
    }
    return false
  })

  const isClient = computed(() => {
    if (rolesStore) {
      return rolesStore.isClient(userRole.value)
    }
    return false
  })

  const isRoleAbove = (otherRole: string | null) => {
    if (rolesStore) {
      return rolesStore.isRoleAbove(userRole.value, otherRole)
    }
    return false
  }

  const canBlockUser = (otherRole: string | null) => {
    if (rolesStore) {
      return rolesStore.canBlockUser(userRole.value, otherRole)
    }
    return false
  }

  const isAboveAgentRole = computed(() => {
    if (rolesStore) {
      return rolesStore.isAboveAgentRole(userRole.value)
    }
    return false
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
