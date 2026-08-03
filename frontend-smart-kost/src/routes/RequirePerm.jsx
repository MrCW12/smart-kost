import { Navigate } from "react-router"
import useAuthStore from "@/stores/authStore"

export default function RequirePerm({ permission, children }) {
  const { user } = useAuthStore()

  if (!permission) return children

  const perms = new Set(user?.effective_permissions || [])
  if (perms.has(permission)) return children

  return <Navigate to="/" replace />
}
