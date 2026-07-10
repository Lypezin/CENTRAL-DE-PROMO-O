import { cookies } from 'next/headers'
import crypto from 'crypto'

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    return process.env.JWT_SECRET
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET must be set in production (min 32 chars). Do not derive secrets from public env vars.'
    )
  }
  // Dev-only fallback so local setup still works without extra config
  return crypto
    .createHash('sha256')
    .update(process.env.NEXT_PUBLIC_SUPABASE_URL || 'dev-only-central-promocoes')
    .digest('hex')
}

const JWT_SECRET = resolveJwtSecret()

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export interface SessionPayload {
  username: string
  name: string
  expires: number
}

/**
 * Encrypts a password using PBKDF2 with a dynamic 16-byte salt and SHA-512.
 * Returns a formatted string 'pbdf2:salt:hash'
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `pbkdf2:${salt}:${hash}`
}

/**
 * Verifies a password against a stored hash string.
 * Supports legacy SHA-256 hashes (exactly 64 hex characters) and new PBKDF2 hashes.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue) return false

  // Backwards compatibility check: old SHA-256 hash was a 64-char hex string
  if (!storedValue.startsWith('pbkdf2:')) {
    const oldHash = crypto.createHash('sha256').update(password).digest('hex')
    return timingSafeEqualHex(oldHash, storedValue)
  }

  const parts = storedValue.split(':')
  if (parts.length !== 3) return false

  const [, salt, hash] = parts
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return timingSafeEqualHex(verifyHash, hash)
}

/**
 * Creates a signed session token and sets it as an HTTP-only secure cookie.
 */
export async function createSession(username: string, name: string): Promise<string> {
  const expires = Date.now() + 1000 * 60 * 60 * 8 // 8 hours
  const payload: SessionPayload = { username, name, expires }
  const payloadStr = JSON.stringify(payload)
  
  // Create signature using HMAC-SHA256
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex')
  
  // Format token as payloadBase64.signature
  const token = `${Buffer.from(payloadStr).toString('base64')}.${signature}`
  
  const cookieStore = await cookies()
  cookieStore.set('admin_auth_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })

  return token
}

/**
 * Verifies a signed session token.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    
    const [payloadBase64, signature] = parts
    const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf-8')
    
    // Verify signature (constant-time)
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex')
    if (!timingSafeEqualHex(expectedSignature, signature)) return null
    
    const payload = JSON.parse(payloadStr) as SessionPayload
    if (payload.expires < Date.now()) return null // Session expired
    
    return payload
  } catch {
    return null
  }
}

/**
 * Helper to fetch the currently authenticated user from cookies.
 */
export async function getAuthenticatedUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_auth_session')?.value
    if (!token) return null
    return verifySessionToken(token)
  } catch {
    return null
  }
}

/**
 * Deletes the session cookie.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('admin_auth_session')
}
