import { useEffect } from "react"
import { Outlet, Navigate, useLocation } from "react-router"
import useAuthStore from "@/stores/authStore"
import useUIStore from "@/stores/uiStore"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import MobileBottomNav from "./MobileBottomNav"
import { LoadingPage } from "@/components/shared/spinner"
import { cn } from "@/lib/utils"

const pageTitles = {
  "/developer": "Developer Dashboard",
  "/developer/users": "User Management",
  "/developer/audit-logs": "Audit Log",
  "/owner": "Owner Dashboard",
  "/owner/properties": "Properti",
  "/owner/rooms": "Kamar",
  "/owner/room-types": "Tipe Kamar",
  "/owner/tenants": "Tenant",
  "/owner/contracts": "Kontrak",
  "/owner/invoices": "Invoices",
  "/owner/payments": "Pembayaran",
  "/owner/expenses": "Pengeluaran",
  "/owner/reports": "Laporan",
  "/owner/utility-settings": "Tarif Utilitas",
  "/owner/tasks": "Task",
  "/admin": "Admin Dashboard",
  "/admin/properties": "Properti",
  "/admin/rooms": "Kamar",
  "/admin/room-types": "Tipe Kamar",
  "/admin/tenants": "Tenant",
  "/admin/contracts": "Kontrak",
  "/admin/invoices": "Invoices",
  "/admin/payments": "Pembayaran",
  "/admin/expenses": "Pengeluaran",
  "/admin/reports": "Laporan",
  "/admin/utility-settings": "Tarif Utilitas",
  "/admin/tasks": "Task",
  "/admin/penghuni": "Penghuni",
  "/staff": "Staff Dashboard",
  "/staff/properties": "Properti",
  "/staff/rooms": "Kamar",
  "/staff/room-types": "Tipe Kamar",
  "/staff/tenants": "Tenant",
  "/staff/contracts": "Kontrak",
  "/staff/invoices": "Invoices",
  "/staff/payments": "Pembayaran",
  "/staff/expenses": "Pengeluaran",
  "/staff/reports": "Laporan",
  "/staff/utility-settings": "Tarif Utilitas",
  "/staff/tasks": "Task",
  "/staff/penghuni": "Penghuni",
}

export default function AppLayout() {
  const { user, token, isLoading, fetchMe } = useAuthStore()
  const { sidebarOpen } = useUIStore()
  const location = useLocation()

  useEffect(() => {
    if (token && user) fetchMe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onFocus = () => {
      if (token && user) fetchMe()
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [token, user, fetchMe])

  if (isLoading) return <LoadingPage />
  if (!token || !user) return <Navigate to="/login" replace />

  const title = pageTitles[location.pathname] || "SmartKost"

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className={cn("transition-all duration-300 pb-20 md:pb-0", sidebarOpen ? "md:ml-64" : "md:ml-16")}>
        <Navbar title={title} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      {/* Mobile bottom navigation - visible below md */}
      <MobileBottomNav />
    </div>
  )
}
