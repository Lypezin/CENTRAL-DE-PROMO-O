import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured.')
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is invalid.')
  }

  const isNewSecretKey = /^sb_secret_[A-Za-z0-9_-]{20,}$/.test(serviceRoleKey)
  let isLegacyServiceRoleKey = false
  try {
    const [, payload] = serviceRoleKey.split('.')
    const claims = payload ? JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; exp?: number } : null
    isLegacyServiceRoleKey = claims?.role === 'service_role' && typeof claims.exp === 'number' && claims.exp > Date.now() / 1000
  } catch {}

  if ((!isNewSecretKey && !isLegacyServiceRoleKey) || serviceRoleKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be a Supabase secret or service-role key.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'X-Client-Info': 'central-promocoes-server' },
    },
  })
}

function getClient(): SupabaseClient {
  client ??= createAdminClient()
  return client
}

// Keeps existing call sites ergonomic while ensuring credentials are checked
// only when a server request actually uses Supabase (not while the app builds).
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const instance = getClient()
    const value = Reflect.get(instance, property, instance) as unknown
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
