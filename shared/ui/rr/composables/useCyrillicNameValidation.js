/** Имя / фамилия: кириллица, пробел, дефис */
const CYRILLIC_NAME_PATTERN = /^[А-Яа-яЁё]+(?:[ '-][А-Яа-яЁё]+)*$/;

export const CYRILLIC_NAME_ONLY_MESSAGE = 'Используйте только кириллицу';

/**
 * @param {string} value
 * @param {{ required?: boolean, emptyMessage?: string }} [options]
 * @returns {string} текст ошибки под полем или ''
 */
export function validateCyrillicName(value, options = {}) {
  const { required = true, emptyMessage = '' } = options;
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return required ? emptyMessage : '';
  }

  if (!CYRILLIC_NAME_PATTERN.test(trimmed)) {
    return CYRILLIC_NAME_ONLY_MESSAGE;
  }

  return '';
}
