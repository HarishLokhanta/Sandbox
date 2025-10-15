import { toast as sonnerToast } from "sonner"

// This is a wrapper around Sonner's toast for backward compatibility
// If you have existing code using useToast(), it will now use Sonner under the hood

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
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
  return {
    toast,
  }
}
