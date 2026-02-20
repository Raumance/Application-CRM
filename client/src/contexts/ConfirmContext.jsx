/**
 * Contexte Confirm - Modales de confirmation (remplace window.confirm)
 */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState({ open: false })

  const confirm = useCallback(({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', variant = 'danger', onConfirm }) => {
    setDialog({
      open: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      variant,
      onConfirm: () => {
        onConfirm?.()
        setDialog({ open: false })
      },
      onCancel: () => setDialog({ open: false }),
    })
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        variant={dialog.variant}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    return {
      confirm: ({ message, onConfirm }) => window.confirm(message) && onConfirm?.(),
    }
  }
  return ctx
}
