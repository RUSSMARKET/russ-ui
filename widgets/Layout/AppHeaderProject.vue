<template>
  <div class="header-wrapper">
    <div class="header-main-row">
      <div class="header-left">
        <div class="menu-toggle-wrapper">
          <div v-if="showProjectNudge" class="project-nudge" title="Выберите проект в селекторе справа">
            <i class="pi pi-info-circle"></i>
            <span>Выберите проект</span>
          </div>
          <button class="menu-toggle" @click="toggleNavigation">
            <i :class="navigation?.isMobileOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
          </button>
        </div>
        <h1 class="page_name">{{ pageTitle }}</h1>
      </div>
      <div v-if="showProjectSwitcher" class="header-project-switcher desktop-switcher">
        <CurrentProjectSwitcher
          :project-options="projectOptions"
          :current-project-id="currentProjectId"
          :project-switching="projectSwitching"
          @change="handleProjectChange"
        />
      </div>
      <div class="header-wrapper-menu">
        <a :href="supportHref" target="_blank" rel="noopener" class="support-header-btn">
          <span class="support-header-text">{{ supportLabel }}</span>
        </a>
        <div class="personal" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu">
          <i class="pi pi-user"></i>
          <span class="personal-text">{{ userName }}</span>
        </div>
        <Menu ref="menuRef" id="overlay_menu" :model="menuItems" :popup="true" />
      </div>
    </div>
    <div v-if="showProjectSwitcher" class="header-project-switcher mobile-switcher">
      <CurrentProjectSwitcher
        :project-options="projectOptions"
        :current-project-id="currentProjectId"
        :project-switching="projectSwitching"
        @change="handleProjectChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Menu } from '../../shared/ui'
import CurrentProjectSwitcher from '../Project/CurrentProjectSwitcher.vue'

export interface ProjectMenuItemOption { label: string; icon: string; command?: () => void; to?: string }
export interface ProjectNavigationState { isMobileOpen?: boolean; openNavigation?: () => void; closeNavigation?: () => void }
type ProjectOption = { id: string | number; name: string }

const props = withDefaults(defineProps<{
  pageTitle?: string
  userName?: string
  menuItems?: ProjectMenuItemOption[]
  supportHref?: string
  supportLabel?: string
  navigation?: ProjectNavigationState
  projectOptions?: ProjectOption[]
  currentProjectId?: string | number | null
  projectSwitching?: boolean
  showProjectSwitcher?: boolean
  projectSelectionRequired?: boolean
  noProjectsAvailable?: boolean
  onProjectChange?: (value: string | number | null) => void | Promise<void>
}>(), {
  pageTitle: '', userName: '', menuItems: () => [], supportHref: 'https://t.me/uliasupport', supportLabel: 'Помощь',
  navigation: undefined, projectOptions: () => [], currentProjectId: null, projectSwitching: false, showProjectSwitcher: false,
  projectSelectionRequired: false, noProjectsAvailable: false, onProjectChange: undefined,
})

const menuRef = ref<any>(null)
const showProjectNudge = computed(() => props.showProjectSwitcher && !props.noProjectsAvailable && !props.projectSwitching && props.projectSelectionRequired && props.projectOptions.length > 0 && (props.currentProjectId == null || props.currentProjectId === ''))
function toggleNavigation() {
  if (!props.navigation) return
  if (props.navigation.isMobileOpen) props.navigation.closeNavigation?.()
  else props.navigation.openNavigation?.()
}
function toggle(event: Event) { menuRef.value?.toggle?.(event) }
function handleProjectChange(value: string | number | null) { props.onProjectChange?.(value) }
</script>

<style scoped>
.header-wrapper {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 10px 30px;
  box-shadow: 0px 2px 10px var(--russ-shadow-color);
  position: relative;
  top: 0;
  right: 0;
  box-sizing: border-box;
  transition: width 0.3s ease;
  will-change: transform;
  backface-visibility: hidden;
  background: var(--russ-bg);
}

.header-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 16px);
  min-width: 0;
  flex: 1 1 auto;
}

.menu-toggle-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.project-nudge {
  position: absolute;
  left: 0;
  top: -12px;
  transform: translateY(-100%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(238, 243, 255, 0.95);
  border: 1px solid rgba(55, 92, 200, 0.2);
  color: var(--russ-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.project-nudge i {
  font-size: 12px;
  opacity: 0.9;
}

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--russ-primary);
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.menu-toggle:hover {
  background: var(--russ-bg-hover);
}

.menu-toggle i {
  font-size: 18px !important;
  width: 18px;
  height: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page_name {
  font-size: clamp(15px, calc(15px + (20 - 15) * ((100vw - 320px) / (960 - 320))), 20px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
}

.header-project-switcher {
  min-width: 0;
}

.desktop-switcher {
  flex: 0 1 320px;
  width: min(320px, 28vw);
  max-width: 100%;
}

.mobile-switcher {
  display: none;
  width: 100%;
}

.header-wrapper-menu {
  display: flex;
  gap: clamp(6px, 2vw, 20px);
  align-items: center;
  min-width: 0;
  flex-shrink: 0;
}

.header-wrapper-menu div:hover {
  cursor: pointer;
}

.personal {
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 16px);
  cursor: pointer;
  font-size: clamp(15px, calc(15px + (18 - 15) * ((100vw - 320px) / (960 - 320))), 18px);
  min-width: 0;
}

#overlay_menu {
  margin-top: 6px !important;
}

.support-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--russ-bg-blue-lighter);
  color: var(--russ-accent);
  border-radius: 6px;
  padding: 10px 30px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: background 0.15s, box-shadow 0.15s, color 0.15s;
  box-shadow: 0 1px 4px var(--russ-shadow-secondary);
}

.support-header-btn:hover {
  background: var(--russ-info-light);
  color: var(--russ-secondary);
  box-shadow: 0 2px 8px var(--russ-shadow-secondary);
}

@media (max-width: 1024px) {
  .menu-toggle {
    display: flex;
  }

  .header-wrapper {
    padding: 8px clamp(4px, 3vw, 15px);
    width: 100%;
  }

  .desktop-switcher {
    display: none;
  }

  .mobile-switcher {
    display: block;
  }

  .personal-text {
    display: none;
  }

  .support-header-btn {
    padding: 10px 18px;
  }
}
</style>
