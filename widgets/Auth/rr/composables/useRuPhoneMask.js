import { ref, watch, onMounted, computed } from 'vue';

const PREFIX = '+7 (';
const PREFIX_LEN = PREFIX.length;

export function formatRuPhone(digits) {
  if (!digits || digits.length === 0) {
    return PREFIX;
  }
  let formatted = PREFIX;
  formatted += digits.slice(0, 3);
  if (digits.length >= 3) {
    formatted += ') ' + digits.slice(3, 6);
    if (digits.length > 6) {
      formatted += '-' + digits.slice(6, 8);
      if (digits.length > 8) {
        formatted += '-' + digits.slice(8, 10);
      }
    }
  }
  return formatted;
}

/** Часть номера для mirror (без «+7 (») */
export function formatLocalPart(digits) {
  if (!digits || digits.length === 0) {
    return '';
  }
  let formatted = digits.slice(0, 3);
  if (digits.length >= 3) {
    formatted += ') ' + digits.slice(3, 6);
    if (digits.length > 6) {
      formatted += '-' + digits.slice(6, 8);
      if (digits.length > 8) {
        formatted += '-' + digits.slice(8, 10);
      }
    }
  }
  return formatted;
}

export function normalizeRuPhoneDigits(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  while (digits.length > 10 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function extractUserDigits(value) {
  let raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (raw.startsWith(PREFIX)) {
    raw = raw.slice(PREFIX_LEN);
  } else {
    raw = raw.replace(/^\+7[\s(-]*/u, '');
    raw = raw.replace(/^8[\s(-]*/u, '');
    raw = raw.replace(/^7\s*\(\s*(?=9)/u, '');
  }

  return normalizeRuPhoneDigits(raw);
}

/** @deprecated PM сохраняет полный формат +7 (999) 999-99-99 из value input */
export function toRuPhoneE164(digits) {
  const normalized = normalizeRuPhoneDigits(digits);
  return normalized.length > 0 ? `+7${normalized}` : '';
}

export function countRuPhoneDigits(value) {
  return extractUserDigits(value).length;
}

export function localMaskGhost(digits) {
  const padded = `${digits || ''}0000000000`.slice(0, 10);
  const sample = formatLocalPart(padded);
  const current = formatLocalPart(digits);
  if (!sample || current.length >= sample.length) {
    return '';
  }
  return sample.slice(current.length);
}

function digitsFromFullValue(value) {
  if (!value || value === PREFIX) {
    return '';
  }
  if (value.startsWith(PREFIX)) {
    const userPart = value.slice(PREFIX_LEN);
    let digits = userPart.replace(/\D/g, '');
    if (digits.length > 10 && (digits[0] === '7' || digits[0] === '8')) {
      digits = digits.slice(1);
    }
    return digits.slice(0, 10);
  }
  return extractUserDigits(value);
}

function cursorAfterAllDigits(formatted, digitsBeforeCursor) {
  if (digitsBeforeCursor <= 0) {
    return PREFIX_LEN;
  }
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      count++;
      if (count === digitsBeforeCursor) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

function normalizeRawToFull(raw, { emptyFallback = '' } = {}) {
  const text = String(raw || '').trim();
  if (!text) {
    return emptyFallback;
  }

  const digits = extractUserDigits(text.startsWith(PREFIX) ? text : text);
  if (digits.length === 0) {
    return text.startsWith(PREFIX) ? PREFIX : emptyFallback;
  }

  return formatRuPhone(digits);
}

export function useRuPhoneMask(props, emit) {
  const errorMessage = ref('');
  const isFocused = ref(false);
  const inputRef = ref(null);
  const fullValue = ref('');
  let autofillSyncTimer = null;

  const localValue = computed(() => {
    const value = fullValue.value;
    if (!value || value === PREFIX) {
      return '';
    }
    if (value.startsWith(PREFIX)) {
      return value.slice(PREFIX_LEN);
    }
    return formatLocalPart(extractUserDigits(value));
  });

  function emitModel(formatted, digits) {
    const next = digits.length > 0 ? formatted : '';
    emit('update:modelValue', next);
    return next;
  }

  function applyFormatted(formatted, el, oldCursorPos) {
    const digits = digitsFromFullValue(formatted);
    const nextFormatted = digits.length > 0 ? formatRuPhone(digits) : (isFocused.value ? PREFIX : '');

    fullValue.value = nextFormatted;
    emitModel(nextFormatted, digits);

    if (!el) {
      return nextFormatted;
    }

    el.value = nextFormatted;

    let newCursorPos = PREFIX_LEN;
    if (digits.length > 0) {
      let digitsBeforeCursor = 0;
      const source = formatted.startsWith(PREFIX) ? formatted : nextFormatted;
      for (let i = 0; i < Math.min(oldCursorPos ?? source.length, source.length); i++) {
        if (/\d/.test(source[i])) {
          digitsBeforeCursor++;
        }
      }
      newCursorPos = cursorAfterAllDigits(nextFormatted, digitsBeforeCursor);
      if (newCursorPos < PREFIX_LEN) {
        newCursorPos = PREFIX_LEN;
      }
    }

    requestAnimationFrame(() => el.setSelectionRange(newCursorPos, newCursorPos));
    return nextFormatted;
  }

  function clearField(el) {
    fullValue.value = '';
    emitModel('', '');
    if (el) {
      el.value = '';
      requestAnimationFrame(() => el.setSelectionRange(0, 0));
    }
  }

  function syncFromDom() {
    if (!inputRef.value) {
      return;
    }
    const raw = inputRef.value.value || '';
    if (!raw) {
      return;
    }
    const normalized = normalizeRawToFull(raw, { emptyFallback: isFocused.value ? PREFIX : '' });
    if (!normalized || normalized === fullValue.value) {
      return;
    }
    applyFormatted(normalized, inputRef.value, normalized.length);
  }

  function scheduleAutofillSync() {
    if (autofillSyncTimer) {
      clearTimeout(autofillSyncTimer);
    }
    const run = () => syncFromDom();
    requestAnimationFrame(run);
    for (const delay of [50, 150, 350, 700, 1500]) {
      setTimeout(run, delay);
    }
    autofillSyncTimer = setTimeout(run, 1500);
  }

  function syncFromModel(newValue) {
    if (isFocused.value) {
      return;
    }

    const digits = extractUserDigits(newValue);
    const formatted = digits.length > 0 ? formatRuPhone(digits) : '';
    fullValue.value = formatted;
    if (inputRef.value) {
      inputRef.value.value = formatted;
    }

    if (formatted && !formatted.startsWith('+7')) {
      errorMessage.value = 'Телефон должен начинаться с +7';
    } else {
      errorMessage.value = props.error || '';
    }
  }

  const handleFocus = (event) => {
    isFocused.value = true;
    errorMessage.value = '';

    const el = event.target;
    const currentValue = el.value || '';
    const isEmpty =
      !currentValue ||
      currentValue === PREFIX ||
      extractUserDigits(currentValue).length === 0;

    if (isEmpty) {
      const fromDom = normalizeRawToFull(currentValue, { emptyFallback: PREFIX });
      if (fromDom && fromDom !== PREFIX && extractUserDigits(fromDom).length > 0) {
        applyFormatted(fromDom, el, fromDom.length);
      } else {
        fullValue.value = PREFIX;
        el.value = PREFIX;
        requestAnimationFrame(() => el.setSelectionRange(PREFIX_LEN, PREFIX_LEN));
      }
    } else {
      requestAnimationFrame(() => {
        if ((el.selectionStart ?? 0) < PREFIX_LEN) {
          el.setSelectionRange(PREFIX_LEN, PREFIX_LEN);
        }
      });
    }

    scheduleAutofillSync();
  };

  const handleBlur = () => {
    isFocused.value = false;
    const digits = digitsFromFullValue(fullValue.value);
    const formatted = digits.length > 0 ? formatRuPhone(digits) : '';
    fullValue.value = formatted;
    emitModel(formatted, digits);
    if (inputRef.value) {
      inputRef.value.value = formatted;
    }
    errorMessage.value = props.error || '';
  };

  const handleInput = (event) => {
    const el = event.target;
    let value = el.value || '';
    const oldCursorPos = el.selectionStart ?? 0;

    if (!value.startsWith(PREFIX)) {
      value = normalizeRawToFull(value, { emptyFallback: PREFIX });
    }

    if (value.length < PREFIX_LEN) {
      value = PREFIX;
    }

    applyFormatted(value, el, oldCursorPos);
  };

  const handlePaste = (event) => {
    const el = event.target;
    let pasted = (event.clipboardData || window.clipboardData)?.getData('text') || '';
    pasted = pasted.trim();
    if (!pasted) {
      return;
    }
    event.preventDefault();
    const digits = extractUserDigits(pasted);
    applyFormatted(formatRuPhone(digits), el, PREFIX_LEN + formatLocalPart(digits).length);
  };

  const handleKeydown = (event) => {
    const el = event.target;
    const selectionStart = el.selectionStart ?? 0;
    const selectionEnd = el.selectionEnd ?? 0;
    const value = el.value || '';
    const isFullSelection = selectionStart === 0 && selectionEnd === value.length && value.length > 0;

    const navKeys = [
      'Tab', 'Shift', 'Control', 'Alt', 'Meta',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
    ];

    if (event.key === 'Backspace' || event.key === 'Delete') {
      if (isFullSelection || (selectionStart < PREFIX_LEN && selectionEnd > PREFIX_LEN)) {
        event.preventDefault();
        fullValue.value = PREFIX;
        emitModel(PREFIX, '');
        requestAnimationFrame(() => {
          el.value = PREFIX;
          el.setSelectionRange(PREFIX_LEN, PREFIX_LEN);
        });
        return;
      }

      if (event.key === 'Backspace' && selectionStart <= PREFIX_LEN && selectionEnd <= PREFIX_LEN) {
        event.preventDefault();
        requestAnimationFrame(() => el.setSelectionRange(PREFIX_LEN, PREFIX_LEN));
        return;
      }

      if (event.key === 'Delete' && selectionStart < PREFIX_LEN) {
        event.preventDefault();
        requestAnimationFrame(() => el.setSelectionRange(PREFIX_LEN, PREFIX_LEN));
        return;
      }

      if (selectionStart < PREFIX_LEN && selectionEnd <= PREFIX_LEN) {
        event.preventDefault();
        requestAnimationFrame(() => el.setSelectionRange(PREFIX_LEN, PREFIX_LEN));
        return;
      }

      return;
    }

    if (selectionStart < PREFIX_LEN && !navKeys.includes(event.key) && !(event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      requestAnimationFrame(() => el.setSelectionRange(PREFIX_LEN, PREFIX_LEN));
      return;
    }

    if (navKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  };

  watch(() => props.error, (val) => {
    errorMessage.value = val || '';
  });

  watch(() => props.modelValue, syncFromModel, { immediate: true });

  const syncFromInputElement = () => {
    syncFromDom();
  };

  onMounted(() => {
    requestAnimationFrame(() => {
      syncFromDom();
      scheduleAutofillSync();
    });
  });

  const clear = () => {
    clearField(inputRef.value);
    requestAnimationFrame(() => inputRef.value?.focus());
  };

  return {
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
  };
}
