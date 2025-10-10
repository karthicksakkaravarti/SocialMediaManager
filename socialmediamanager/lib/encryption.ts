import crypto from 'crypto'

// Get encryption key from environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.warn(
    'ENCRYPTION_KEY is not set or invalid. Please set a 64-character hex string in .env.local'
  )
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // For GCM
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH

/**
 * Encrypts a string using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: salt:iv:tag:encrypted
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty')
  }

  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not configured')
  }

  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)

  const key = crypto.pbkdf2Sync(
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    salt,
    100000,
    32,
    'sha512'
  )

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ])

  const tag = cipher.getAuthTag()

  // Combine: salt + iv + tag + encrypted
  const result = Buffer.concat([salt, iv, tag, encrypted])

  return result.toString('hex')
}

/**
 * Decrypts an encrypted string
 * @param encryptedData - Encrypted text in format: salt:iv:tag:encrypted
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty')
  }

  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not configured')
  }

  const buffer = Buffer.from(encryptedData, 'hex')

  const salt = buffer.subarray(0, SALT_LENGTH)
  const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION)
  const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION)
  const encrypted = buffer.subarray(ENCRYPTED_POSITION)

  const key = crypto.pbkdf2Sync(
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    salt,
    100000,
    32,
    'sha512'
  )

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

/**
 * Generates a random encryption key (64-character hex string)
 * Use this to generate a new encryption key for .env.local
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}
