import 'server-only'

import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false

  try {
    const configuredOrigin = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL
    if (process.env.NODE_ENV === 'production' && !configuredOrigin) return false
    const expected = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin
    return new URL(origin).origin === expected
  } catch {
    return false
  }
}

export function getRequestIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp && realIp.length <= 64 && !realIp.includes(',')) return realIp

  // Proxies commonly append the address they observed. Taking the rightmost
  // forwarded entry prevents a caller from selecting an arbitrary first entry.
  const forwarded = request.headers.get('x-forwarded-for')
  const forwardedIp = forwarded?.split(',').at(-1)?.trim()
  return forwardedIp && forwardedIp.length <= 64 ? forwardedIp : 'unknown'
}

export async function consumeRateLimit(
  request: Request,
  scope: 'login' | 'registration' | 'visit',
  limit = 10,
  windowSeconds = 60,
  identity = '',
): Promise<boolean> {
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${scope}:${getRequestIp(request)}:${identity.trim().toLowerCase()}`)
    .digest('hex')

  const { data, error } = await supabaseAdmin.rpc('consume_admin_rate_limit', {
    p_fingerprint: fingerprint,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) throw new Error('Admin rate limiter unavailable.')
  return data === true
}

export function hasJsonContentType(request: NextRequest): boolean {
  return request.headers.get('content-type')?.toLowerCase().startsWith('application/json') === true
}
