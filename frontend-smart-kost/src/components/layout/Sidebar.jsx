import { NavLink, useNavigate } from "react-router"
import useAuthStore from "@/stores/authStore"
import useUIStore from "@/stores/uiStore"
import {
  Home, Building2, DoorOpen, Users, FileText, Receipt, Wallet,
  ClipboardList, ClipboardCheck, BarChart3, ChevronLeft, ChevronRight,
  LogOut, Shield, UserCog, Settings, Zap, BedDouble
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const MODULE_ITEMS = (prefix) => [
  { label: "Dashboard", icon: Home, to: `/${prefix}` },
  { label: "Properti", icon: Building2, to: `/${prefix}/properties`, permission: "property.view" },
  { label: "Kamar", icon: DoorOpen, to: `/${prefix}/rooms`, permission: "room.view" },
  { label: "Tipe Kamar", icon: BedDouble, to: `/${prefix}/room-types`, permission: "room-type.view" },
  { label: "Tenant", icon: Users, to: `/${prefix}/tenants`, permission: "tenant.view" },
  { label: "Penghuni", icon: Users, to: `/${prefix}/penghuni`, permission: "tenant.view" },
  { label: "Kontrak", icon: FileText, to: `/${prefix}/contracts`, permission: "contract.view" },
  { label: "Invoices", icon: Receipt, to: `/${prefix}/invoices`, permission: "invoice.view" },
  { label: "Pembayaran", icon: Wallet, to: `/${prefix}/payments`, permission: "payment.view" },
  { label: "Pengeluaran", icon: ClipboardList, to: `/${prefix}/expenses`, permission: "expense.view" },
  { label: "Task", icon: ClipboardCheck, to: `/${prefix}/tasks`, permission: "cleaning.view" },
  { label: "Laporan", icon: BarChart3, to: `/${prefix}/reports`, permission: "report.finance" },
  { label: "Tarif Utilitas", icon: Zap, to: `/${prefix}/utility-settings`, permission: "utility.setting" },
  { label: "Profil", icon: Settings, to: "/profile" },
]

export const menuByRole = {
  developer: [
    { section: "System", items: [
      { label: "Dashboard", icon: Home, to: "/developer" },
      { label: "Users", icon: UserCog, to: "/developer/users", permission: "user.view" },
      { label: "Audit Log", icon: Shield, to: "/developer/audit-logs", permission: "system.audit-log" },
    ]},
    { section: "Operasional", items: [
      { label: "Properti", icon: Building2, to: "/owner/properties", permission: "property.view" },
      { label: "Kamar", icon: DoorOpen, to: "/owner/rooms", permission: "room.view" },
      { label: "Tipe Kamar", icon: BedDouble, to: "/owner/room-types", permission: "room-type.view" },
      { label: "Tenant", icon: Users, to: "/owner/tenants", permission: "tenant.view" },
      { label: "Penghuni", icon: Users, to: "/owner/penghuni", permission: "tenant.view" },
      { label: "Invoices", icon: Receipt, to: "/owner/invoices", permission: "invoice.view" },
      { label: "Pembayaran", icon: Wallet, to: "/owner/payments", permission: "payment.view" },
      { label: "Pengeluaran", icon: ClipboardList, to: "/owner/expenses", permission: "expense.view" },
      { label: "Task", icon: ClipboardCheck, to: "/developer/tasks", permission: "cleaning.view" },
      { label: "Task Staff", icon: ClipboardCheck, to: "/staff/tasks", permission: "cleaning.view" },
      { label: "Laporan", icon: BarChart3, to: "/owner/reports", permission: "report.finance" },
      { label: "Utilitas", icon: Zap, to: "/owner/utility-settings", permission: "utility.setting" },
      { label: "Profil", icon: Settings, to: "/profile" },
    ]},
  ],
  owner: [{ items: MODULE_ITEMS("owner") }],
  admin: [{ items: MODULE_ITEMS("admin") }],
  staff: [{ items: MODULE_ITEMS("staff") }],
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  const role = user?.roles?.[0]?.name
  const userPerms = new Set(user?.effective_permissions || [])
  const hasPerm = (p) => !p || userPerms.has(p)
  const sections = (menuByRole[role] || [])
    .map((section) => ({ ...section, items: section.items.filter((i) => hasPerm(i.permission)) }))
    .filter((s) => s.items.length > 0)

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              SK
            </div>
            <span className="font-bold text-lg">SmartKost</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-white/10 h-8 w-8"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.section && sidebarOpen && (
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.section}
              </p>
            )}
            {section.section && sidebarOpen && sIdx > 0 && <div className="mx-3 my-2 border-t border-white/10" />}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.split("/").length <= 3 && !item.to.includes("properties") && !item.to.includes("rooms") && !item.to.includes("tenants") && !item.to.includes("payments") && !item.to.includes("cleaning") && !item.to.includes("invoices") && !item.to.includes("expenses") && !item.to.includes("reports") && !item.to.includes("contracts") && !item.to.includes("users") && !item.to.includes("audit")}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground",
                      !sidebarOpen && "justify-center px-2"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold uppercase overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url.replace(/^https?:\/\/[^/]+/, "")} alt={user?.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/70 hover:bg-white/10 h-8 w-8"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-foreground/70 hover:bg-white/10 h-9"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  )
}
