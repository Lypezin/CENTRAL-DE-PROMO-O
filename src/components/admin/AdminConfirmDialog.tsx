'use client'

import { useEffect, useId, useRef } from 'react'

type AdminConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  busyLabel?: string
  busy?: boolean
  tone?: 'primary' | 'danger'
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busyLabel = 'Processando…',
  busy = false,
  tone = 'danger',
  onCancel,
  onConfirm,
}: AdminConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const confirmClass = tone === 'danger'
    ? 'border border-red-700 bg-red-700 text-white hover:bg-red-800'
    : 'border border-blue-700 bg-blue-700 text-white hover:bg-blue-800'

  return (
    <dialog
      ref={dialogRef}
      className="admin-confirm-dialog m-auto w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onCancel()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !busy) onCancel()
      }}
    >
      <div className="space-y-5 p-6 sm:p-7">
        <div className="space-y-2">
          <h2 id={titleId} className="text-balance text-xl font-bold text-slate-950">{title}</h2>
          <p id={descriptionId} className="text-pretty text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onConfirm()}
            className={`min-h-11 rounded-lg px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${confirmClass}`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
