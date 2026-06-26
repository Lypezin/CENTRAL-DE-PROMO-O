import { useRef, useEffect, useState, useCallback } from 'react'

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutoSave<T extends Record<string, unknown>>(
  data: T,
  onSave: (fields: T) => Promise<void>,
  delay = 2000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevDataRef = useRef(data)
  const pendingRef = useRef(false)
  const [status, setStatus] = useState<AutoSaveStatus>('idle')

  const save = useCallback(async () => {
    pendingRef.current = false
    setStatus('saving')
    try {
      await onSave(data)
      setStatus('saved')
      prevDataRef.current = { ...data }
    } catch {
      setStatus('error')
    }
  }, [data, onSave])

  useEffect(() => {
    const hasChanged = Object.keys(data).some(
      key => data[key] !== prevDataRef.current[key]
    )
    if (!hasChanged) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    pendingRef.current = true
    setStatus('saving')

    timerRef.current = setTimeout(() => {
      save()
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
    if (pendingRef.current) {
      save()
    }
  }, [save])

  const resetStatus = useCallback(() => {
    setStatus('idle')
  }, [])

  return { status, triggerNow, resetStatus }
}
