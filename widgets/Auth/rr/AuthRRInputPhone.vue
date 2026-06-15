<template>
  <AuthRRField :label="label" :error="displayError" :field-id="fieldId">
    <div
      class="auth-rr-input-phone"
      :class="{
        'auth-rr-input-phone--error': !!displayError,
        'auth-rr-input-phone--clearable': clearable && showClear,
      }"
    >
      <span class="auth-rr-input-phone__flag" aria-hidden="true">
        <img :src="authRrFlags.ru" width="24" height="24" alt="" />
      </span>
      <!-- Полный номер для менеджеров паролей (видимое поле — только локальная часть) -->
      <input
        :id="`${fieldId}-credential`"
        type="text"
        tabindex="-1"
        aria-hidden="true"
        class="auth-rr-input-phone__credential"
        :name="name"
        :value="credentialValue"
        :autocomplete="credentialAutocomplete"
        @input="syncFromCredentialInput"
        @change="syncFromCredentialInput"
        @animationstart="onCredentialAutofill"
        @animationend="onCredentialAutofill"
      />
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
              :value="localValue"
              type="tel"
              inputmode="tel"
              autocomplete="off"
              maxlength="15"
              class="auth-rr-input-phone__input"
              :readonly="readonly"
              aria-label="Номер телефона"
              @beforeinput="handleBeforeInput"
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
import { extractUserDigits, localMaskGhost, toRuPhoneE164, useRuPhoneMask } from './composables/useRuPhoneMask.js';
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
    /** autocomplete скрытого поля с полным номером (+7…) для менеджеров паролей */
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
  localValue,
  errorMessage,
  handleFocus,
  handleBlur,
  handleInput,
  handleBeforeInput,
  handlePaste,
  handleKeydown,
  clear,
  syncFromInputElement,
  scheduleAutofillSync,
  syncFromCredentialInput,
} = useRuPhoneMask(props, emit);

const credentialValue = computed(() => toRuPhoneE164(extractUserDigits(localValue.value)));

const maskTail = computed(() => {
  const digits = extractUserDigits(`+7 (${localValue.value}`);
  return localMaskGhost(digits);
});

const showClear = computed(() => extractUserDigits(`+7 (${localValue.value}`).length > 0);

const displayError = computed(() => props.error || errorMessage.value);

function onAutofillAnimation(event: AnimationEvent) {
  if (event.animationName === 'auth-rr-phone-autofill-start') {
    syncFromInputElement();
    scheduleAutofillSync();
  }
}

function onCredentialAutofill(event: AnimationEvent) {
  if (event.animationName === 'auth-rr-phone-autofill-start') {
    syncFromCredentialInput(event);
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
  const end = localValue.value.length;
  requestAnimationFrame(() => input.setSelectionRange(end, end));
}
</script>
