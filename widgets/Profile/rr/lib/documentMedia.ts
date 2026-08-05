/** Accept / MIME helpers for profile document uploads. */

export const ACCEPT_IMAGE = 'image/*'
export const ACCEPT_IMAGE_OR_PDF = 'image/*,application/pdf'

export function isImageFile(file: File | null | undefined): boolean {
  if (!file) return false
  const type = String(file.type || '').toLowerCase()
  if (type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(String(file.name || ''))
}

export function isPdfFile(file: File | null | undefined): boolean {
  if (!file) return false
  const type = String(file.type || '').toLowerCase()
  if (type === 'application/pdf' || type.includes('pdf')) return true
  return /\.pdf$/i.test(String(file.name || ''))
}

export function isPdfSource(
  url: string | null | undefined,
  file?: File | null,
  pathHint?: string | null,
): boolean {
  if (file && isPdfFile(file)) return true
  if (file && isImageFile(file)) return false
  const hint = `${url || ''} ${pathHint || ''}`
  return /\.pdf($|\?|#)/i.test(hint)
}

export function isAllowedUploadFile(
  file: File,
  mode: 'image' | 'image-or-pdf',
): boolean {
  if (mode === 'image') return isImageFile(file)
  return isImageFile(file) || isPdfFile(file)
}

export function uploadRejectMessage(mode: 'image' | 'image-or-pdf'): string {
  if (mode === 'image') return 'Загрузите изображение (JPG, PNG, WEBP)'
  return 'Загрузите изображение или PDF'
}
