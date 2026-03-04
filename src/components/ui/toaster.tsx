"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info"

type ToastInput = {
  title: string
  description?: string
  duration?: number
  variant?: ToastVariant
}

type ToastItem = ToastInput & {
  id: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (input: ToastInput) => string
  dismiss: (id: string) => void
}

const DEFAULT_TOAST_DURATION_MS = 4000
const MAX_TOAST_COUNT = 4
const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

function createToastId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
}

function getToastVariantClasses(variant: ToastVariant) {
  if (variant === "success") {
    return "border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100"
  }

  if (variant === "error") {
    return "border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-100"
  }

  return "border-blue-500/40 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-100"
}

function getToastVariantIcon(variant: ToastVariant) {
  if (variant === "success") {
    return CheckCircle2
  }

  if (variant === "error") {
    return AlertCircle
  }

  return Info
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const timeoutRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))

    const timer = timeoutRef.current[id]
    if (timer) {
      clearTimeout(timer)
      delete timeoutRef.current[id]
    }
  }, [])

  const toast = React.useCallback(
    ({ duration = DEFAULT_TOAST_DURATION_MS, variant = "info", ...input }: ToastInput) => {
      const id = createToastId()

      setToasts((prev) => {
        const next: ToastItem[] = [...prev, { id, variant, ...input }]
        return next.slice(Math.max(0, next.length - MAX_TOAST_COUNT))
      })

      timeoutRef.current[id] = setTimeout(() => {
        dismiss(id)
      }, duration)

      return id
    },
    [dismiss]
  )

  React.useEffect(() => {
    return () => {
      Object.values(timeoutRef.current).forEach((timer) => clearTimeout(timer))
      timeoutRef.current = {}
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => {
          const Icon = getToastVariantIcon(item.variant)

          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto rounded-md border p-3 shadow-md backdrop-blur-sm",
                getToastVariantClasses(item.variant)
              )}
            >
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs opacity-90">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  className="shrink-0 rounded p-0.5 opacity-75 transition hover:opacity-100"
                  onClick={() => dismiss(item.id)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.")
  }

  return context
}
