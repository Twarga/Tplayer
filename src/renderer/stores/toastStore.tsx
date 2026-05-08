import React, { createContext, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: Toast[]
  add: (message: string, type?: ToastType) => void
  remove: (id: string) => void
}

const defaultToastStore: ToastStore = {
  toasts: [],
  add: () => {},
  remove: () => {},
}

let toastStoreRef: ToastStore = defaultToastStore

const ToastContext = createContext<ToastStore>(defaultToastStore)

export function useToast() {
  return useContext(ToastContext)
}

export function getToastStore(): ToastStore {
  return toastStoreRef
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  toastStoreRef = { toasts, add, remove }

  return (
    <ToastContext.Provider value={toastStoreRef}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-in slide-in-from-right ${
            toast.type === 'success'
              ? 'bg-accent text-background'
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-surface-2 text-primary border border-border-default'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="opacity-70 hover:opacity-100 text-lg">&times;</button>
          </div>
        </div>
      ))}
    </div>
  )
}
