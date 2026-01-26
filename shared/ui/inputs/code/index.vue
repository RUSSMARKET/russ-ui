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
      pattern="[0-9]*"
      maxlength="7"
    />
    <label v-if="variant === 'on' && placeholder" :for="name" :class="['input-label', { 'label-active': displayValue || isFocused }]">
      {{ placeholder }}
    </label>
    <!-- <small v-if="touched && error" class="error-text">{{ error }}</small> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = defineProps({
  value: { type: String, required: true },
  placeholder: { type: String, default: "Код подразделения" },
  name: { type: String, default: "passport_code" },
  variant: { type: String, default: "on" },
});

const emit = defineEmits(["update:value"]);

const localValue = ref(props.value);
const error = ref("");
const touched = ref(false);
const isFocused = ref(false);

const displayValue = computed(() => localValue.value);

function formatCode(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}`;
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const formatted = formatCode(target.value);
  localValue.value = formatted;
  emit("update:value", formatted);
}

const onBlur = () => {
  touched.value = true;
  isFocused.value = false;
};

watch(() => props.value, (newValue) => {
  localValue.value = newValue;
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
  border: 1px solid #ced4da;
  border-radius: 0.5rem;
  font-size: clamp(
    14px,
    calc(14px + (16 - 14) * ((100vw - 320px) / (1920 - 320))),
    16px
  );
  font-family: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: #ffffff;
  color: #374151;
}

.custom-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.input-error {
  border: 1px solid #ef4444 !important;
  box-shadow: 0 0 0 2px #ffd6d6;
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
  color: #6b7280;
  pointer-events: none;
  transition: all 0.2s ease;
  background: #ffffff;
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
  color: #3b82f6;
  border-radius: 5px 5px 0 0;
}

.custom-input:disabled ~ .input-label,
.custom-input[readonly] ~ .input-label {
  background: #f3f4f6;
  opacity: 0.6;
}

.error-text {
  color: #ef4444;
  font-size: clamp(
    10px,
    calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
    12px
  );
  margin-top: 0.25rem;
  display: block;
}
</style>
