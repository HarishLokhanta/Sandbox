import { toast as sonnerToast } from "sonner"
import * as React from "react"

// This is a wrapper around Sonner's toast for backward compatibility
// If you have existing code using useToast(), it will now use Sonner under the hood

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export type Toast = ToastProps & {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
}

export function toast({ title, description, variant }: ToastProps) {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
    })
  }

  return sonnerToast(title, {
    description,
  })
}

// For components that use useToast hook, provide a simple wrapper
export function useToast() {
  const [toasts] = React.useState<Toast[]>([])

  return {
    toast,
    toasts,
    dismiss: () => {},
  }
}
