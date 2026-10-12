import 'server-only'

import { cookies } from 'next/headers'
import crypto from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabaseServer'

const COOKIE_NAME = 'admin_auth_session'
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.')
  }
  return secret
}

export function assertSessionConfiguration(): void {
  getJwtSecret()
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b)) return false
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  return bufA.length === bufB.length && bufA.length > 0 && crypto.timingSafeEqual(bufA, bufB)
}

export interface SessionPayload {
  username: string
  name: string
  expires: number
  sid: string
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 210_000, 64, 'sha512').toString('hex')
  return `pbkdf2:${salt}:${hash}`
}

export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue || password.length > 1024) return false

  if (!storedValue.startsWith('pbkdf2:')) {
    const oldHash = crypto.createHash('sha256').update(password).digest('hex')
    return timingSafeEqualHex(oldHash, storedValue)
  }

  const parts = storedValue.split(':')
  if (parts.length !== 3 || !/^[a-f0-9]{32}$/i.test(parts[1]) || !/^[a-f0-9]{128}$/i.test(parts[2])) {
    return false
  }

  const [, salt, hash] = parts
  const verifyHash = crypto.pbkdf2Sync(password, salt, 210_000, 64, 'sha512').toString('hex')
  return timingSafeEqualHex(verifyHash, hash)
}

function hashSessionId(sid: string): string {
  return crypto.createHash('sha256').update(sid).digest('hex')
}

export async function createSession(username: string, name: string): Promise<string> {
  const sid = crypto.randomUUID()
  const expires = Date.now() + SESSION_DURATION_MS
  const payload: SessionPayload = { username, name, expires, sid }
  const payloadStr = JSON.stringify(payload)
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(payloadStr).digest('hex')
  const token = `${Buffer.from(payloadStr).toString('base64url')}.${signature}`

  const { error } = await supabaseAdmin.from('admin_sessions').insert({
    session_hash: hashSessionId(sid),
    username,
    expires_at: new Date(expires).toISOString(),
  })
  if (error) throw new Error('Could not create an administrator session.')

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  })

  return token
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || token.length > 2048) return null

  try {
    const [payloadBase64, signature, extra] = token.split('.')
    if (!payloadBase64 || !signature || extra !== undefined) return null

    const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    const expected = crypto.createHmac('sha256', getJwtSecret()).update(payloadStr).digest('hex')
    if (!timingSafeEqualHex(expected, signature)) return null

    const value: unknown = JSON.parse(payloadStr)
    if (!value || typeof value !== 'object') return null
    const payload = value as Partial<SessionPayload>
    if (
      typeof payload.username !== 'string' || payload.username.length < 1 || payload.username.length > 120 ||
      typeof payload.name !== 'string' || payload.name.length < 1 || payload.name.length > 120 ||
      typeof payload.sid !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.sid) ||
      typeof payload.expires !== 'number' || !Number.isFinite(payload.expires) || payload.expires <= Date.now()
    ) return null

    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function getAuthenticatedUser(): Promise<SessionPayload | null> {
  try {
    const token = (await cookies()).get(COOKIE_NAME)?.value
    if (!token) return null

    const payload = verifySessionToken(token)
    if (!payload) return null

    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('session_hash')
      .eq('session_hash', hashSessionId(payload.sid))
      .eq('username', payload.username)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    return error || !data ? null : payload
  } catch {
    return null
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const payload = token ? verifySessionToken(token) : null

  if (payload) {
    const { error } = await supabaseAdmin
      .from('admin_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('session_hash', hashSessionId(payload.sid))
      .is('revoked_at', null)
    if (error) throw new Error('Could not revoke administrator session.')
  }

  cookieStore.delete(COOKIE_NAME)
}
