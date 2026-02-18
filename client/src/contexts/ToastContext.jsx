/**
 * Contexte Toast - Notifications modernes (inspiré Salesforce, HubSpot)
 */
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const toast = useCallback(
    (msg) => addToast(msg, 'info'),
    [addToast]
  )
  toast.success = (msg) => addToast(msg, 'success')
  toast.error = (msg) => addToast(msg, 'error')
  toast.warning = (msg) => addToast(msg, 'warning')

  return (
    <ToastContext.Provider value={{ toasts, addToast, toast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      toast: (msg) => alert(msg),
      toasts: [],
    }
  }
  return ctx
}
