<template>
  <AuthRRField :label="label" :error="displayError" :field-id="fieldId">
    <div
      class="auth-rr-input-phone"
      data-auth-rr-phone="v2-full"
      :class="{
        'auth-rr-input-phone--error': !!displayError,
        'auth-rr-input-phone--clearable': clearable && showClear,
      }"
    >
      <span class="auth-rr-input-phone__flag" aria-hidden="true">
        <img :src="authRrFlags.ru" width="24" height="24" alt="" />
      </span>
      <div class="auth-rr-input-phone__editor" @mousedown="onEditorPointer">
        <div class="auth-rr-input-phone__value">
          <span class="auth-rr-input-phone__prefix" aria-hidden="true">+7 (</span>
          <div class="auth-rr-input-phone__local">
            <span class="auth-rr-input-phone__mirror" aria-hidden="true">
              <span class="auth-rr-input-phone__typed">{{ localValue }}</span>
              <span v-if="maskTail" class="auth-rr-input-phone__ghost">{{ maskTail }}</span>
            </span>
            <input
              :id="fieldId"
              ref="inputRef"
              :value="fullValue"
              type="tel"
              inputmode="tel"
              :name="name"
              :autocomplete="credentialAutocomplete"
              maxlength="18"
              class="auth-rr-input-phone__input"
              :readonly="readonly"
              aria-label="Номер телефона"
              @input="handleInput"
              @focus="handleFocus"
              @blur="handleBlur"
              @paste="handlePaste"
              @keydown="handleKeydown"
              @change="syncFromInputElement"
              @animationstart="onAutofillAnimation"
              @animationend="onAutofillAnimation"
            />
          </div>
        </div>
      </div>
      <button
        v-if="clearable && showClear && !readonly"
        type="button"
        class="auth-rr-input-phone__clear"
        tabindex="-1"
        aria-label="Очистить номер"
        @mousedown.prevent
        @click="clear"
      >
        <img :src="authRrIcons.clear" width="24" height="24" alt="" />
      </button>
    </div>
  </AuthRRField>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import AuthRRField from './AuthRRField.vue';
import { authRrFlags, authRrIcons } from 'bibli/shared/assets/auth/rr';
import { extractUserDigits, localMaskGhost, useRuPhoneMask } from './composables/useRuPhoneMask.js';
import './auth-rr-input.css';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    name?: string;
    readonly?: boolean;
    error?: string;
    fieldId?: string;
    clearable?: boolean;
    /** login: username — PM сохраняет +7 (999) 999-99-99 */
    credentialAutocomplete?: string;
  }>(),
  {
    modelValue: '',
    label: 'Номер телефона',
    name: 'phone',
    readonly: false,
    error: '',
    fieldId: '',
    clearable: false,
    credentialAutocomplete: 'tel',
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const autoId = useId();
const fieldId = computed(() => props.fieldId || `auth-rr-phone-${autoId}`);

const {
  inputRef,
  fullValue,
  localValue,
  errorMessage,
  handleFocus,
  handleBlur,
  handleInput,
  handlePaste,
  handleKeydown,
  clear,
  syncFromInputElement,
  scheduleAutofillSync,
} = useRuPhoneMask(props, emit);

const maskTail = computed(() => localMaskGhost(extractUserDigits(fullValue.value)));

const showClear = computed(() => extractUserDigits(fullValue.value).length > 0);

const displayError = computed(() => props.error || errorMessage.value);

function onAutofillAnimation(event: AnimationEvent) {
  if (event.animationName === 'auth-rr-phone-autofill-start') {
    syncFromInputElement();
    scheduleAutofillSync();
  }
}

function onEditorPointer(event: MouseEvent) {
  const target = event.target;
  if (target instanceof Element && target.closest('.auth-rr-input-phone__clear')) {
    return;
  }
  const input = inputRef.value;
  if (!input || props.readonly || target === input) {
    return;
  }
  event.preventDefault();
  input.focus();
  const end = input.value.length;
  requestAnimationFrame(() => input.setSelectionRange(end, end));
}
</script>
