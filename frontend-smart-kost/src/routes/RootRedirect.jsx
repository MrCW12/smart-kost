import { Navigate } from "react-router"
import useAuthStore from "@/stores/authStore"

export default function RootRedirect() {
  const { user, token } = useAuthStore()

  if (!token || !user) return <Navigate to="/login" replace />

  const role = user.roles?.[0]?.name
  const routes = { developer: "/developer", owner: "/owner", admin: "/admin", staff: "/staff" }

  return <Navigate to={routes[role] || "/login"} replace />
}
