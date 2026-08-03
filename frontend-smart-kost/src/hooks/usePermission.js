import { useMemo } from "react"
import useAuthStore from "@/stores/authStore"

export function usePermission() {
  const { user } = useAuthStore()

  return useMemo(() => {
    const perms = new Set(user?.effective_permissions || [])
    return {
      has: (p) => !p || perms.has(p),
      can: (p) => !!p && perms.has(p),
    }
  }, [user?.effective_permissions])
}
