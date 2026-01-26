<template>
  <button
    :type="type"
    :class="['custom-button', props.class, { 'custom-button-loading': loading, 'custom-button-disabled': disabled }]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="custom-button-loading-icon">
      <i class="pi pi-spin pi-spinner"></i>
    </span>
    <span v-else-if="icon && !iconRight" class="custom-button-icon">
      <i :class="icon"></i>
    </span>
    <span class="custom-button-label">
      <slot>{{ label }}</slot>
    </span>
    <span v-if="icon && iconRight" class="custom-button-icon custom-button-icon-right">
      <i :class="icon"></i>
    </span>
  </button>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  class: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Далее'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  },
  iconRight: {
    type: Boolean,
    default: false
  },
  onclick: {
    type: Function,
    default: () => {}
  }
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
    if (props.onclick) {
      props.onclick(event)
    }
  }
}
</script>

<style scoped>
.custom-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.75rem 1.5rem;
  font-family: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
  font-size: clamp(
    14px,
    calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))),
    18px
  );
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  background-color: #213e89;
  color: #ffffff;
  min-height: 2.5rem;
}

.custom-button:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: #1b3170;
  border-color: #1b3170;
}

.custom-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(33, 62, 137, 0.2);
}

.custom-button:active:not(:disabled):not(.custom-button-disabled) {
  background-color: #162954;
  border-color: #162954;
}

.custom-button:disabled,
.custom-button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.custom-button-loading {
  cursor: wait;
}

.custom-button-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-button-icon {
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
}

.custom-button-icon-right {
  order: 2;
}

.custom-button-loading-icon {
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
}

/* Варианты кнопок */
.custom-button.custom-button-secondary {
  background-color: #ffffff;
  color: #213e89;
  border-color: #213e89;
}

.custom-button.custom-button-secondary:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: #213e89;
  color: #ffffff;
}

.custom-button.custom-button-success {
  background-color: #28a745;
  color: #ffffff;
  border-color: #28a745;
}

.custom-button.custom-button-success:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: #218838;
  border-color: #218838;
}

.custom-button.custom-button-danger {
  background-color: #dc3545;
  color: #ffffff;
  border-color: #dc3545;
}

.custom-button.custom-button-danger:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: #c82333;
  border-color: #c82333;
}

.custom-button.custom-button-text {
  background-color: transparent;
  color: #213e89;
  border-color: transparent;
  padding: 0.5rem;
}

.custom-button.custom-button-text:hover:not(:disabled):not(.custom-button-disabled) {
  background-color: rgba(33, 62, 137, 0.1);
}
</style>