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
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.5rem;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  /* Градиент как в PrimeVue: светлее сверху, темнее снизу */
  background: linear-gradient(
    180deg,
    var(--russ-primary-light) 0%,
    var(--russ-primary) 50%,
    var(--russ-primary-dark) 100%
  );
  color: var(--russ-text-inverse);
  min-height: 2.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.custom-button:hover:not(:disabled):not(.custom-button-disabled) {
  background: linear-gradient(
    180deg,
    var(--russ-primary) 0%,
    var(--russ-primary-hover) 50%,
    var(--russ-primary-dark) 100%
  );
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.custom-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--russ-focus-ring);
}

.custom-button:active:not(:disabled):not(.custom-button-disabled) {
  background: linear-gradient(
    180deg,
    var(--russ-primary-dark) 0%,
    var(--russ-primary-active) 50%,
    var(--russ-primary-dark) 100%
  );
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
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

/* Варианты кнопок — градиенты и переходы */
.custom-button.custom-button-secondary {
  background: linear-gradient(
    180deg,
    var(--russ-bg) 0%,
    var(--russ-bg-secondary) 100%
  );
  color: var(--russ-primary);
  border-color: var(--russ-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.custom-button.custom-button-secondary:hover:not(:disabled):not(.custom-button-disabled) {
  background: linear-gradient(
    180deg,
    var(--russ-bg-hover) 0%,
    var(--russ-primary) 100%
  );
  color: var(--russ-text-inverse);
  border-color: var(--russ-primary);
  box-shadow: 0 2px 6px var(--russ-shadow-color);
}

.custom-button.custom-button-success {
  background: linear-gradient(
    180deg,
    var(--russ-success) 0%,
    var(--russ-success-dark) 100%
  );
  color: var(--russ-text-inverse);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.custom-button.custom-button-success:hover:not(:disabled):not(.custom-button-disabled) {
  background: linear-gradient(
    180deg,
    var(--russ-success-dark) 0%,
    var(--russ-success) 100%
  );
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.custom-button.custom-button-danger {
  background: linear-gradient(
    180deg,
    var(--russ-error) 0%,
    var(--russ-error-dark) 100%
  );
  color: var(--russ-text-inverse);
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.custom-button.custom-button-danger:hover:not(:disabled):not(.custom-button-disabled) {
  background: linear-gradient(
    180deg,
    var(--russ-error-dark) 0%,
    var(--russ-error) 100%
  );
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.custom-button.custom-button-text {
  background: transparent;
  color: var(--russ-primary);
  border-color: transparent;
  padding: 0.5rem;
  box-shadow: none;
}

.custom-button.custom-button-text:hover:not(:disabled):not(.custom-button-disabled) {
  background: var(--russ-bg-secondary);
  box-shadow: none;
}
</style>