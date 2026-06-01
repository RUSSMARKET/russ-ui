import { ref, watch, onMounted } from 'vue';

const PREFIX = '+7 (';

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

/** Часть номера в поле ввода (без +7 () */
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

/**
 * Локальная часть номера (10 цифр): убирает +7 / 8 / 7 в начале при вставке и автозаполнении.
 */
export function normalizeRuPhoneDigits(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  while (digits.length > 10 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1);
  }

  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1);
  }

  if (
    digits.length === 10 &&
    (digits[0] === '7' || digits[0] === '8') &&
    digits[1] === '9'
  ) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function extractUserDigits(value) {
  const raw = String(value || '');
  const userPart = raw.startsWith(PREFIX) ? raw.slice(PREFIX.length) : raw;
  return normalizeRuPhoneDigits(userPart);
}

export function countRuPhoneDigits(value) {
  return extractUserDigits(value).length;
}

/** Серый хвост маски в поле (000) 000-00-00 пока вводите */
export function localMaskGhost(digits) {
  const padded = `${digits || ''}0000000000`.slice(0, 10);
  const sample = formatLocalPart(padded);
  const current = formatLocalPart(digits);
  if (!sample || current.length >= sample.length) {
    return '';
  }
  return sample.slice(current.length);
}

function cursorAfterDigits(formatted, digitsBeforeCursor) {
  if (digitsBeforeCursor <= 0) {
    return 0;
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

export function useRuPhoneMask(props, emit) {
  const errorMessage = ref('');
  const isFocused = ref(false);
  const inputRef = ref(null);
  const localValue = ref('');

  function emitFull(digits) {
    const full = digits.length > 0 ? formatRuPhone(digits) : '';
    emit('update:modelValue', full);
    return full;
  }

  function syncFromModel(newValue) {
    if (isFocused.value) {
      return;
    }

    const digits = extractUserDigits(newValue);
    const local = formatLocalPart(digits);
    localValue.value = local;
    if (inputRef.value) {
      inputRef.value.value = local;
    }

    const full = formatRuPhone(digits);
    if (full && !full.startsWith('+7')) {
      errorMessage.value = 'Телефон должен начинаться с +7';
    } else {
      errorMessage.value = props.error || '';
    }
  }

  const handleFocus = () => {
    isFocused.value = true;
    errorMessage.value = '';
  };

  const handleBlur = () => {
    isFocused.value = false;
    const digits = extractUserDigits(`${PREFIX}${localValue.value}`);
    const local = formatLocalPart(digits);
    localValue.value = local;
    emitFull(digits);
    if (inputRef.value) {
      inputRef.value.value = local;
    }
    errorMessage.value = props.error || '';
  };

  const handleInput = (event) => {
    const el = event.target;
    const oldCursorPos = el.selectionStart ?? 0;
    const oldRaw = el.value || '';

    let digitsBeforeCursor = 0;
    for (let i = 0; i < Math.min(oldCursorPos, oldRaw.length); i++) {
      if (/\d/.test(oldRaw[i])) {
        digitsBeforeCursor++;
      }
    }

    const digits = normalizeRuPhoneDigits(oldRaw);

    const formatted = formatLocalPart(digits);
    const newCursorPos = cursorAfterDigits(formatted, digitsBeforeCursor);

    localValue.value = formatted;
    emitFull(digits);

    requestAnimationFrame(() => {
      el.value = formatted;
      el.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const handlePaste = (event) => {
    const el = event.target;
    let pasted = (event.clipboardData || window.clipboardData)?.getData('text') || '';
    pasted = pasted.trim();
    if (!pasted) {
      return;
    }
    event.preventDefault();

    const digits = normalizeRuPhoneDigits(pasted);

    const formatted = formatLocalPart(digits);
    localValue.value = formatted;
    emitFull(digits);
    el.value = formatted;
    requestAnimationFrame(() => el.setSelectionRange(formatted.length, formatted.length));
  };

  const handleKeydown = (event) => {
    const allowed = [
      'Tab', 'Shift', 'Control', 'Alt', 'Meta',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
      'Backspace', 'Delete',
    ];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) {
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
    if (!inputRef.value) {
      return;
    }
    handleInput({ target: inputRef.value });
  };

  onMounted(() => {
    if (!props.modelValue) {
      emitFull('');
    }
    requestAnimationFrame(() => {
      if (inputRef.value?.value) {
        syncFromInputElement();
      }
    });
  });

  const clear = () => {
    localValue.value = '';
    if (inputRef.value) {
      inputRef.value.value = '';
    }
    emitFull('');
    requestAnimationFrame(() => inputRef.value?.focus());
  };

  return {
    inputRef,
    localValue,
    errorMessage,
    handleFocus,
    handleBlur,
    handleInput,
    handlePaste,
    handleKeydown,
    clear,
    syncFromInputElement,
  };
}
