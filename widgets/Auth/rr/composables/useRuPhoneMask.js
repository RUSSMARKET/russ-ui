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
    raw = raw.slice(PREFIX.length);
  } else {
    raw = raw.replace(/^\+7[\s(-]*/u, '');
    raw = raw.replace(/^8[\s(-]*/u, '');
    raw = raw.replace(/^7\s*\(\s*(?=9)/u, '');
  }

  return normalizeRuPhoneDigits(raw);
}

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

function normalizeRawToFull(raw) {
  const digits = extractUserDigits(raw);
  return digits.length > 0 ? formatRuPhone(digits) : '';
}

export function useRuPhoneMask(props, emit) {
  const errorMessage = ref('');
  const isFocused = ref(false);
  const inputRef = ref(null);
  const localValue = ref('');
  let autofillSyncTimer = null;

  function getCredentialEl(el) {
    const inputId = el?.id;
    if (!inputId) {
      return null;
    }
    const node = document.getElementById(`${inputId}-credential`);
    return node instanceof HTMLInputElement ? node : null;
  }

  /** PM читает/пишет полный +7 (999) 999-99-99 — без Vue :value, чтобы не затирать autofill */
  function updateCredentialDom(el, fullFormatted) {
    const credentialEl = getCredentialEl(el);
    if (!credentialEl) {
      return;
    }
    const next = fullFormatted && fullFormatted !== PREFIX ? fullFormatted : '';
    if (credentialEl.value !== next) {
      credentialEl.value = next;
    }
  }

  function emitModel(digits) {
    const next = digits.length > 0 ? formatRuPhone(digits) : '';
    emit('update:modelValue', next);
    return next;
  }

  function applyDigits(digits, el, cursorDigits = digits.length) {
    const local = formatLocalPart(digits);
    const full = digits.length > 0 ? formatRuPhone(digits) : '';

    localValue.value = local;
    emitModel(digits);

    if (el) {
      el.value = local;
      updateCredentialDom(el, full);
      const cursorPos = cursorAfterDigits(local, cursorDigits);
      requestAnimationFrame(() => el.setSelectionRange(cursorPos, cursorPos));
    }

    return local;
  }

  function clearField(el) {
    localValue.value = '';
    emitModel('');
    if (el) {
      el.value = '';
      updateCredentialDom(el, '');
      requestAnimationFrame(() => el.setSelectionRange(0, 0));
    }
  }

  function readCredentialRaw(el) {
    return getCredentialEl(el)?.value?.trim() || '';
  }

  function syncFromDom() {
    const el = inputRef.value;
    if (!el) {
      return;
    }

    const credentialRaw = readCredentialRaw(el);
    const visibleRaw = el.value || '';
    const credentialDigits = extractUserDigits(credentialRaw);
    const visibleDigits = extractUserDigits(visibleRaw);

    const digits = credentialDigits.length >= visibleDigits.length
      ? credentialDigits
      : visibleDigits;

    const currentDigits = extractUserDigits(localValue.value);
    if (digits !== currentDigits) {
      applyDigits(digits, el, digits.length);
    } else if (credentialRaw && credentialRaw !== normalizeRawToFull(credentialRaw)) {
      updateCredentialDom(el, normalizeRawToFull(credentialRaw));
    }
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
    const local = formatLocalPart(digits);
    const full = digits.length > 0 ? formatRuPhone(digits) : '';

    localValue.value = local;
    if (inputRef.value) {
      inputRef.value.value = local;
      updateCredentialDom(inputRef.value, full);
    }

    if (full && !full.startsWith('+7')) {
      errorMessage.value = 'Телефон должен начинаться с +7';
    } else {
      errorMessage.value = props.error || '';
    }
  }

  const handleFocus = () => {
    isFocused.value = true;
    errorMessage.value = '';
    scheduleAutofillSync();
  };

  const handleBlur = () => {
    isFocused.value = false;
    const digits = extractUserDigits(localValue.value);
    const local = formatLocalPart(digits);
    const full = digits.length > 0 ? formatRuPhone(digits) : '';

    localValue.value = local;
    emitModel(digits);

    if (inputRef.value) {
      inputRef.value.value = local;
      updateCredentialDom(inputRef.value, full);
    }

    errorMessage.value = props.error || '';
  };

  const handleInput = (event) => {
    const el = event.target;
    const oldRaw = el.value || '';
    const oldCursorPos = el.selectionStart ?? 0;
    const inputType = event.inputType || '';
    const prevDigits = extractUserDigits(localValue.value);
    const rawDigits = oldRaw.replace(/\D/g, '');
    const isBulkInsert =
      inputType === 'insertFromPaste' ||
      inputType === 'insertReplacementText' ||
      inputType === 'insertFromDrop' ||
      rawDigits.length - prevDigits.length > 1 ||
      oldRaw.includes('+');

    if (isBulkInsert) {
      applyDigits(extractUserDigits(oldRaw), el);
      return;
    }

    let digitsBeforeCursor = 0;
    for (let i = 0; i < Math.min(oldCursorPos, oldRaw.length); i++) {
      if (/\d/.test(oldRaw[i])) {
        digitsBeforeCursor++;
      }
    }

    applyDigits(extractUserDigits(oldRaw), el, digitsBeforeCursor);
  };

  const handleBeforeInput = (event) => {
    const inputType = event.inputType || '';
    if (
      inputType !== 'insertReplacementText' &&
      inputType !== 'insertFromPaste' &&
      inputType !== 'insertFromDrop'
    ) {
      return;
    }

    event.preventDefault();
    const el = event.target;
    const text = event.data ?? '';
    const currentRaw = el.value || '';
    const start = el.selectionStart ?? currentRaw.length;
    const end = el.selectionEnd ?? currentRaw.length;
    const merged = `${currentRaw.slice(0, start)}${text}${currentRaw.slice(end)}`;
    applyDigits(extractUserDigits(merged), el);
  };

  const handlePaste = (event) => {
    const el = event.target;
    let pasted = (event.clipboardData || window.clipboardData)?.getData('text') || '';
    pasted = pasted.trim();
    if (!pasted) {
      return;
    }
    event.preventDefault();
    applyDigits(extractUserDigits(pasted), el);
  };

  const handleKeydown = (event) => {
    const el = event.target;
    const selectionStart = el.selectionStart ?? 0;
    const selectionEnd = el.selectionEnd ?? 0;
    const value = el.value || '';
    const isFullSelection = selectionStart === 0 && selectionEnd === value.length && value.length > 0;

    if ((event.key === 'Backspace' || event.key === 'Delete') && isFullSelection) {
      event.preventDefault();
      clearField(el);
      return;
    }

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

  const syncFromCredentialInput = () => {
    syncFromDom();
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
  };
}
