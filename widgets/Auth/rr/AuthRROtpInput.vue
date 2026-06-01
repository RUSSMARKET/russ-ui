<template>
  <div class="auth-rr-otp">
    <input
      ref="inputRef"
      class="auth-rr-otp__code-input"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="6"
      autocomplete="one-time-code"
      :value="cellsToDigits(cells)"
      aria-label="Код из SMS"
      @input="onInput"
      @keydown="onKeydown"
      @paste="onPaste"
      @focus="onFocus"
      @click="onSelect"
      @keyup="onSelect"
    />
    <div class="auth-rr-otp__cells" aria-hidden="true">
      <div
        v-for="(_, index) in OTP_LENGTH"
        :key="index"
        class="auth-rr-otp__cell"
        :class="{
          'auth-rr-otp__cell--filled': !!cells[index],
          'auth-rr-otp__cell--active': activeIndex === index,
        }"
        @mousedown="onCellPointer(index, $event)"
      >
        <span v-if="!cells[index]" class="auth-rr-otp__placeholder">—</span>
        <span v-else class="auth-rr-otp__digit">{{ cells[index] }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cellsToDigits, useAuthRrOtp, OTP_LENGTH } from './composables/useAuthRrOtp.js';
import './auth-rr-otp.css';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
  }>(),
  {
    modelValue: '',
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const {
  inputRef,
  cells,
  activeIndex,
  onInput,
  onKeydown,
  onPaste,
  onCellPointer,
  onFocus,
  onSelect,
} = useAuthRrOtp(props, emit);
</script>
