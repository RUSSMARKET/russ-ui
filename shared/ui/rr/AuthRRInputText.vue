<template>
  <AuthRRField :label="label" :error="error" :field-id="fieldId">
    <input
      :id="fieldId"
      v-model="localValue"
      :name="name"
      :type="type"
      class="auth-rr-input__control auth-rr-input__control--align-left"
      :class="{ 'auth-rr-input__control--error': !!error }"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :readonly="readonly"
    />
  </AuthRRField>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import AuthRRField from './AuthRRField.vue';
import './auth-rr-input.css';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    placeholder?: string;
    name?: string;
    type?: string;
    error?: string;
    autocomplete?: string;
    disabled?: boolean;
    readonly?: boolean;
    fieldId?: string;
  }>(),
  {
    modelValue: '',
    label: '',
    placeholder: '',
    name: 'text',
    type: 'text',
    error: '',
    autocomplete: 'off',
    disabled: false,
    readonly: false,
    fieldId: '',
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const autoId = useId();
const fieldId = computed(() => props.fieldId || `auth-rr-text-${autoId}`);

const localValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});
</script>
