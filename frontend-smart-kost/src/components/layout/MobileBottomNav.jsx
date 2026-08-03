import { useState } from "react"
import { useLocation, useNavigate } from "react-router"
import {
  Home, Building2, DoorOpen, Users, MoreHorizontal, X, LogOut,
  UserCog, ClipboardCheck
} from "lucide-react"
import useAuthStore from "@/stores/authStore"
import { menuByRole } from "./Sidebar"
import { cn } from "@/lib/utils"

const bottomNavByRole = {
  developer: [
    { label: "Home", icon: Home, to: "/developer" },
    { label: "Users", icon: UserCog, to: "/developer/users", permission: "user.view" },
    { label: "Lainnya", icon: MoreHorizontal, more: true },
  ],
  owner: [
    { label: "Home", icon: Home, to: "/owner" },
    { label: "Properti", icon: Building2, to: "/owner/properties", permission: "property.view" },
    { label: "Kamar", icon: DoorOpen, to: "/owner/rooms", permission: "room.view" },
    { label: "Tenant", icon: Users, to: "/owner/tenants", permission: "tenant.view" },
    { label: "Lainnya", icon: MoreHorizontal, more: true },
  ],
  admin: [
    { label: "Home", icon: Home, to: "/admin" },
    { label: "Kamar", icon: DoorOpen, to: "/admin/rooms", permission: "room.view" },
    { label: "Tenant", icon: Users, to: "/admin/tenants", permission: "tenant.view" },
    { label: "Lainnya", icon: MoreHorizontal, more: true },
  ],
  staff: [
    { label: "Home", icon: Home, to: "/staff" },
    { label: "Task", icon: ClipboardCheck, to: "/staff/tasks", permission: "cleaning.view" },
    { label: "Lainnya", icon: MoreHorizontal, more: true },
  ],
}

export default function MobileBottomNav() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const role = user?.roles?.[0]?.name
  const userPerms = new Set(user?.effective_permissions || [])
  const hasPerm = (p) => !p || userPerms.has(p)
  const tabs = (bottomNavByRole[role] || []).filter((t) => hasPerm(t.permission))
  const sections = (menuByRole[role] || [])
    .map((section) => ({ ...section, items: section.items.filter((i) => hasPerm(i.permission)) }))
    .filter((s) => s.items.length > 0)

  const isActive = (to) => {
    const depth = to.split("/").length
    if (depth <= 2) return location.pathname === to
    return location.pathname === to || location.pathname.startsWith(to + "/")
  }

  const someDirectActive = tabs.some((t) => !t.more && isActive(t.to))
  const moreActive =
    tabs.some((t) => t.more) &&
    !someDirectActive &&
    location.pathname.startsWith("/" + role)

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate("/login")
  }

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex">
          {tabs.map((tab) =>
            tab.more ? (
              <button
                key={tab.label}
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                  moreActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ) : (
              <button
                key={tab.to}
                type="button"
                onClick={() => navigate(tab.to)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                  isActive(tab.to) ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          )}
        </div>
      </nav>

      {/* More bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-background p-4 pb-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Menu</p>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="mb-2">
                {section.section && (
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.section}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        navigate(item.to)
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        isActive(item.to)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  )
}
