<template>
  <div class="input-wrapper">
    <input
      :id="name"
      :value="displayValue"
      @input="handleInput"
      @focus="isFocused = true"
      @blur="onBlur"
      :name="name"
      :placeholder="variant === 'on' ? '' : placeholder"
      :class="['custom-input', { 'input-error': touched && error }]"
      type="text"
      inputmode="numeric"
      maxlength="10"
    />
    <label v-if="variant === 'on' && placeholder" :for="name" :class="['input-label', { 'label-active': displayValue || isFocused }]">
      {{ placeholder }}
    </label>
    <!-- <small v-if="touched && error" class="error-text">{{ error }}</small> -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },  
  value: { type: String, default: "" },    
  placeholder: { type: String, default: "Дата (ДД.ММ.ГГГГ)" },
  name: { type: String, default: "date" },
  variant: { type: String, default: "on" },
});

const emit = defineEmits(["update:modelValue", "update:value", "validation"]);

const internalValue = ref(props.modelValue || props.value);
const error = ref("");
const touched = ref(false);
const isFocused = ref(false);

const displayValue = computed(() => internalValue.value);

function formatDate(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const formatted = formatDate(target.value);
  internalValue.value = formatted;
  emit("update:modelValue", formatted);
  emit("update:value", formatted);
  validate(formatted);
}

function validate(val: string) {
  const digits = val.replace(/\D/g, "");
  let isValid = false;
  if (digits.length === 8) {
    const day = parseInt(digits.slice(0, 2), 10);
    const month = parseInt(digits.slice(2, 4), 10) - 1;
    const year = parseInt(digits.slice(4, 8), 10);
    const date = new Date(year, month, day);
    isValid =
      date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  }
  error.value = isValid ? "" : "Введите корректную дату";
  emit("validation", isValid);
}

const onBlur = () => {
  touched.value = true;
  isFocused.value = false;
  validate(internalValue.value);
};

watch(
  () => [props.modelValue, props.value],
  ([modelValue, value]) => {
    internalValue.value = modelValue ?? value ?? "";
  }
);
</script>

<style scoped>
.input-wrapper {
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.custom-input {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
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

.input-error {
  border: 1px solid var(--russ-input-error) !important;
  box-shadow: 0 0 0 2px var(--russ-input-error-bg);
}

.input-label {
  position: absolute;
  left: 0.75rem;
  top: 1rem;
  z-index: 2;
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
  line-height: 1.2;
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

.error-text {
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
