<template>
  <Teleport to="body">
    <Transition name="menu-fade">
      <div
        v-if="visible"
        ref="panelRef"
        :id="id"
        :class="['menu-panel', panelClass]"
        :style="panelStyle"
        @click.stop
      >
        <ul class="menu-list">
          <li
            v-for="(item, index) in model"
            :key="index"
            class="menu-item"
            @click="onItemClick(item)"
          >
            <i v-if="item.icon" :class="item.icon" class="menu-item-icon"></i>
            <span class="menu-item-label">{{ item.label }}</span>
          </li>
        </ul>
      </div>
    </Transition>
    <div
      v-if="visible"
      class="menu-backdrop"
      aria-hidden="true"
      @click="close"
    />
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  id: { type: String, default: '' },
  model: { type: Array, default: () => [] },
  popup: { type: Boolean, default: false },
  panelClass: { type: String, default: '' }
})

const visible = ref(false)
const panelRef = ref(null)
const panelStyle = ref({})

function toggle(event) {
  if (visible.value) {
    close()
    return
  }
  if (event && event.currentTarget && props.popup) {
    const rect = event.currentTarget.getBoundingClientRect()
    panelStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      minWidth: `${Math.max(rect.width, 180)}px`
    }
  } else {
    panelStyle.value = {}
  }
  visible.value = true
}

function close() {
  visible.value = false
}

function onItemClick(item) {
  if (item.command && typeof item.command === 'function') {
    item.command()
  }
  close()
}

// Закрытие по Escape
function onKeydown(e) {
  if (e.key === 'Escape') close()
}

watch(visible, (isVisible) => {
  if (isVisible) {
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

defineExpose({
  toggle,
  close,
  visible
})
</script>

<style scoped>
.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1099;
}

.menu-panel {
  z-index: 1100;
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  box-shadow: 0 4px 20px var(--russ-shadow-color);
  padding: 6px 0;
  min-width: 180px;
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--russ-text-primary);
  transition: background 0.15s;
  white-space: nowrap;
}

.menu-item:hover {
  background: var(--russ-bg-hover);
}

.menu-item-icon {
  font-size: 1rem;
  color: var(--russ-text-tertiary);
  flex-shrink: 0;
}

.menu-item-label {
  flex: 1;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}
</style>
