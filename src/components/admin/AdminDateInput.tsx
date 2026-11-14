'use client'

import { useRef } from 'react'

interface AdminDateInputProps {
  id: string
  value: string
  onChange: (value: string) => void
}

export default function AdminDateInput({ id, value, onChange }: AdminDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const openCalendar = () => {
    const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null
    if (!input?.showPicker) return

    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <input
      ref={inputRef}
      id={id}
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onClick={openCalendar}
      className="admin-input w-full"
    />
  )
}
