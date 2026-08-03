import { Navigate } from "react-router"
import useAuthStore from "@/stores/authStore"
import { LoadingPage } from "@/components/shared/spinner"

export default function ProtectedRoute({ roles, children }) {
  const { user, token, isLoading } = useAuthStore()

  if (isLoading) return <LoadingPage />
  if (!token || !user) return <Navigate to="/login" replace />

  if (roles && roles.length > 0) {
    const userRole = user.roles?.[0]?.name
    if (!roles.includes(userRole) && userRole !== "developer") {
      return <Navigate to="/" replace />
    }
  }

  return children
}
