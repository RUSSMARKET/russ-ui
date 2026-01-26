const getCrypto = (): Crypto | undefined => {
  try {
    return (globalThis as any).crypto as Crypto | undefined
  } catch {
    return undefined
  }
}

const hasWebCrypto = (): boolean => {
  const c = getCrypto()
  return !!(c && (c as any).subtle)
}

const generateKey = async (password: string): Promise<CryptoKey> => {
  const c = getCrypto()
  if (!c || !(c as any).subtle) {
    throw new Error('WebCrypto subtle is not available')
  }
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  const hashBuffer = await c.subtle!.digest('SHA-256', data)
  
  const keyBuffer = hashBuffer.slice(0, 32)
  
  return await c.subtle!.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

const generateIV = (): Uint8Array => {
  const c = getCrypto()
  if (c && (c as any).getRandomValues) {
    return c.getRandomValues(new Uint8Array(12))
  }
  const arr = new Uint8Array(12)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Math.floor(Math.random() * 256)
  }
  return arr
}

export const encryptData = async (data: string, password: string): Promise<string> => {
  try {
    if (!hasWebCrypto()) {
      return 'PLAIN.' + btoa(encodeURIComponent(data))
    }

    const key = await generateKey(password)
    const iv = generateIV()
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    
    const c = getCrypto()!
    const encryptedBuffer = await c.subtle!.encrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer
      },
      key,
      dataBuffer.buffer.slice(dataBuffer.byteOffset, dataBuffer.byteOffset + dataBuffer.byteLength) as ArrayBuffer
    )
    
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)
    
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Ошибка при шифровании:', error)
    throw new Error('Не удалось зашифровать данные')
  }
}

export const decryptData = async (encryptedData: string, password: string): Promise<string> => {
  try {
    if (encryptedData.startsWith('PLAIN.')) {
      return atob(encryptedData.slice(6))
    }

    if (!hasWebCrypto()) {
      return atob(encryptedData)
    }

    const key = await generateKey(password)
    
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    )
    
    const iv = combined.slice(0, 12)
    const encryptedBuffer = combined.slice(12)
    
    const c = getCrypto()!
    const decryptedBuffer = await c.subtle!.decrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer
      },
      key,
      encryptedBuffer.buffer.slice(encryptedBuffer.byteOffset, encryptedBuffer.byteOffset + encryptedBuffer.byteLength) as ArrayBuffer
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    console.error('Ошибка при дешифровании:', error)
    throw new Error('Не удалось дешифровать данные')
  }
}

export const isEncrypted = (data: string): boolean => {
  try {
    if (typeof data !== 'string') return false
    if (data.startsWith('PLAIN.')) return true
    atob(data)
    return true
  } catch {
    return false
  }
}

export const createUserEncryptionKey = (token: string): string => {
  const salt = 'fintech_app_2024'
  return `${token}_${salt}`
}