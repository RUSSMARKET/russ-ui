<template>
  <div class="input-wrapper">
    <input
      :id="name"
      v-model="localValue"
      :name="name"
      :placeholder="variant === 'on' ? '' : placeholder"
      :class="['custom-input', { 'input-error': error }]"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :type="type"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <label v-if="variant === 'on' && placeholder" :for="name" :class="['input-label', { 'label-active': localValue || isFocused }]">
      {{ placeholder }}
    </label>
    <!-- <span v-if="error" class="text-red-500 text-xs mt-1 block">{{ error }}</span> -->
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Текст",
  },
  name: {
    type: String,
    default: "name",
  },
  variant: {
    type: String,
    default: "on",
  },
  error: {
    type: String,
    default: "",
  },
  autocomplete: {
    type: String,
    default: undefined,
  },
  inputmode: {
    type: String,
    default: undefined,
  },
  type: {
    type: String,
    default: 'text',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  maxlength: {
    type: [String, Number],
    default: undefined,
  },
});

const emit = defineEmits(["update:modelValue"]);

const isFocused = ref(false);

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>

<style scoped>
.input-wrapper {
  position: relative;
  width: 100%;
}

.custom-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--russ-input-border);
  border-radius: 0.5rem;
  font-size: clamp(
    14px,
    calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))),
    16px
  );
  font-family: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: var(--russ-input-bg);
  color: var(--russ-input-text);
}

.custom-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
  box-shadow: 0 0 0 2px var(--russ-focus-ring);
}

.custom-input:disabled,
.custom-input[readonly] {
  background-color: var(--russ-input-bg-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.input-error {
  border: 1px solid var(--russ-input-border-error) !important;
  box-shadow: 0 0 0 2px var(--russ-input-error-bg);
}

.input-label {
  position: absolute;
  left: 0.75rem;
  top: 1rem;
  font-size: clamp(
    12px,
    calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
    14px
  );
  color: var(--russ-input-placeholder);
  pointer-events: none;
  transition: all 0.2s ease;
  background: var(--russ-input-bg);
  padding: 0 0.25rem;
}

.custom-input:focus ~ .input-label,
.label-active {
  top: -0.625rem;
  left: 0.5rem;
  font-size: clamp(
    10px,
    calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
    12px
  );
  color: var(--russ-input-border-focus);
  border-radius: 5px 5px 0 0;
}

.custom-input:disabled ~ .input-label,
.custom-input[readonly] ~ .input-label {
  background: var(--russ-input-bg-disabled);
  opacity: 0.6;
}

.text-red-500 {
  color: var(--russ-input-error);
  font-size: clamp(
    10px,
    calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
    12px
  );
  margin-top: 0.25rem;
  display: block;
}
</style>
