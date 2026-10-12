'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export type AdminSession =
  | { status: 'checking' }
  | { status: 'authenticated'; name: string }
  | { status: 'unauthenticated' }
  | { status: 'unavailable' }

type AdminSessionContextValue = {
  session: AdminSession
  retrying: boolean
  setAuthenticated: (name: string) => void
  setUnauthenticated: () => void
  retrySession: () => Promise<void>
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [session, setSession] = useState<AdminSession>({ status: 'checking' })
  const [retrying, setRetrying] = useState(false)
  const sessionRef = useRef(session)

  const updateSession = useCallback((next: AdminSession) => {
    sessionRef.current = next
    setSession(next)
  }, [])

  const setAuthenticated = useCallback((name: string) => {
    updateSession({ status: 'authenticated', name: name.trim() || 'Admin' })
  }, [updateSession])

  const setUnauthenticated = useCallback(() => {
    updateSession({ status: 'unauthenticated' })
  }, [updateSession])

  const verifySession = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/admin/verify', { cache: 'no-store', signal })
      const result = await response.json().catch(() => null) as { authenticated?: boolean; name?: string } | null
      if (signal?.aborted) return

      if (response.status === 503 || !response.ok) {
        // Keep the last known good session during transient failures. Every protected API
        // still validates the signed cookie and revocable database session independently.
        if (sessionRef.current.status !== 'authenticated') {
          updateSession({ status: 'unavailable' })
        }
        return
      }

      if (result?.authenticated === true) {
        updateSession({ status: 'authenticated', name: result.name?.trim() || 'Admin' })
      } else if (result?.authenticated === false) {
        updateSession({ status: 'unauthenticated' })
      } else if (sessionRef.current.status !== 'authenticated') {
        updateSession({ status: 'unavailable' })
      }
    } catch {
      if (!signal?.aborted && sessionRef.current.status !== 'authenticated') {
        updateSession({ status: 'unavailable' })
      }
    }
  }, [updateSession])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => void verifySession(controller.signal))
    return () => controller.abort()
  }, [pathname, verifySession])

  const retrySession = useCallback(async () => {
    setRetrying(true)
    try {
      await verifySession()
    } finally {
      setRetrying(false)
    }
  }, [verifySession])

  return (
    <AdminSessionContext.Provider value={{ session, retrying, setAuthenticated, setUnauthenticated, retrySession }}>
      {children}
    </AdminSessionContext.Provider>
  )
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext)
  if (!context) throw new Error('useAdminSession must be used inside AdminSessionProvider.')
  return context
}
