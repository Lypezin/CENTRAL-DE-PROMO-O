import { useRef, useEffect, useState, useCallback } from 'react'

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function shallowEqualRecord(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => a[key] === b[key])
}

export function useAutoSave<T extends Record<string, unknown>>(
  data: T,
  onSave: (fields: T) => Promise<void>,
  delay = 2000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevDataRef = useRef(data)
  const pendingRef = useRef(false)
  const savingRef = useRef(false)
  const latestDataRef = useRef(data)
  const onSaveRef = useRef(onSave)
  const [status, setStatus] = useState<AutoSaveStatus>('idle')

  latestDataRef.current = data
  onSaveRef.current = onSave

  const save = useCallback(async () => {
    if (savingRef.current) {
      // Another save is in flight; mark that we still have pending changes
      pendingRef.current = true
      return
    }

    pendingRef.current = false
    savingRef.current = true
    setStatus('saving')

    const snapshot = { ...latestDataRef.current }

    try {
      await onSaveRef.current(snapshot)
      prevDataRef.current = snapshot
      setStatus('saved')

      // If user edited while saving, schedule another save of the latest snapshot
      if (pendingRef.current || !shallowEqualRecord(latestDataRef.current, snapshot)) {
        pendingRef.current = false
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          void save()
        }, delay)
      }
    } catch {
      setStatus('error')
    } finally {
      savingRef.current = false
    }
  }, [delay])

  useEffect(() => {
    if (shallowEqualRecord(data, prevDataRef.current)) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    pendingRef.current = true
    // Only show "saving" once the debounce fires; keep prior status until then
    // unless we already saved once (then show pending via saving after delay)

    timerRef.current = setTimeout(() => {
      void save()
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [data, delay, save])

  const triggerNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (pendingRef.current || !shallowEqualRecord(latestDataRef.current, prevDataRef.current)) {
      void save()
    }
  }, [save])

  const resetStatus = useCallback(() => {
    setStatus('idle')
  }, [])

  return { status, triggerNow, resetStatus }
}
