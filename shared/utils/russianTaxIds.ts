/** Цифры без маски. */
export function taxDigitsOnly(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D+/g, '')
}

function innCheckDigit(digits: number[], coefficients: number[]): number {
  const sum = coefficients.reduce((acc, coef, i) => acc + coef * digits[i], 0)
  return (sum % 11) % 10
}

/** ИНН юрлица / банка: 10 цифр с контрольным разрядом. */
export function isValidInn10(inn: string | null | undefined): boolean {
  const value = taxDigitsOnly(inn)
  if (!/^\d{10}$/.test(value)) return false
  const digits = value.split('').map(Number)
  return innCheckDigit(digits, [2, 4, 10, 3, 5, 9, 4, 6, 8]) === digits[9]
}

/** ИНН физлица / ИП: 12 цифр с двумя контрольными разрядами. */
export function isValidInn12(inn: string | null | undefined): boolean {
  const value = taxDigitsOnly(inn)
  if (!/^\d{12}$/.test(value)) return false
  const digits = value.split('').map(Number)
  const n11 = innCheckDigit(digits, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8])
  const n12 = innCheckDigit(digits, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8])
  return n11 === digits[10] && n12 === digits[11]
}

/**
 * ОГРНИП: 15 цифр.
 * Контроль: (число из первых 14 цифр) % 13 % 10 === последняя цифра.
 */
export function isValidOgrnip(ogrnip: string | null | undefined): boolean {
  const value = taxDigitsOnly(ogrnip)
  if (!/^\d{15}$/.test(value)) return false
  const base = Number(value.slice(0, 14))
  if (!Number.isSafeInteger(base)) return false
  return (base % 13) % 10 === Number(value[14])
}
