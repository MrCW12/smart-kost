import { useState } from "react"
import { useLocation, useNavigate } from "react-router"
import {
  Home, Building2, DoorOpen, Users, MoreHorizontal, X, LogOut,
  UserCog, ClipboardCheck, UserRound, Settings
} from "lucide-react"
import useAuthStore from "@/stores/authStore"
import { menuByRole } from "./Sidebar"
import { cn } from "@/lib/utils"

const bottomNavByRole = {
  developer: [
    { label: "Home", icon: Home, to: "/developer" },
    { label: "Task", icon: ClipboardCheck, to: "/developer/tasks", permission: "cleaning.view" },
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
    .map((section) => ({ ...section, items: section.items.filter((i) => i.to !== "/profile" && hasPerm(i.permission)) }))
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
      {/* Floating pill bottom tab bar */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="pointer-events-auto mx-4 mb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-around rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,41,0.85)] px-2 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
          {tabs.map((tab) =>
            tab.more ? (
              <button
                key={tab.label}
                type="button"
                aria-label={tab.label}
                onClick={() => setOpen(true)}
                className={cn(
                  "group flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1 text-[10px] transition-colors duration-200",
                  moreActive ? "font-medium text-white" : "font-medium text-[#8B95A8]"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-11 items-center justify-center rounded-full transition-all duration-200 group-active:scale-90",
                    moreActive
                      ? "bg-[#2563EB] text-white shadow-[0_0_14px_rgba(37,99,235,0.55)]"
                      : "text-[#8B95A8]"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                </span>
                {tab.label}
              </button>
            ) : (
              <button
                key={tab.to}
                type="button"
                aria-label={tab.label}
                onClick={() => navigate(tab.to)}
                className={cn(
                  "group flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1 text-[10px] transition-colors duration-200",
                  isActive(tab.to) ? "font-medium text-white" : "font-medium text-[#8B95A8]"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-11 items-center justify-center rounded-full transition-all duration-200 group-active:scale-90",
                    isActive(tab.to)
                      ? "bg-[#2563EB] text-white shadow-[0_0_14px_rgba(37,99,235,0.55)]"
                      : "text-[#8B95A8]"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                </span>
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
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[rgba(15,23,41,0.95)] p-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] backdrop-blur-md">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#3b82f6]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user?.name || "Pengguna"}</p>
                  <p className="truncate text-xs capitalize text-[#8B95A8]">{role || "guest"}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                className="shrink-0 rounded-full p-2 text-[#8B95A8] transition-all duration-200 hover:bg-white/10 active:scale-90"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="mb-2">
                {section.section && (
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8B95A8]">
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
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-white/10 active:scale-[0.99]",
                        isActive(item.to)
                          ? "bg-[#2563EB] text-white shadow-[0_0_14px_rgba(37,99,235,0.4)]"
                          : "text-white/85"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="mb-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8B95A8]">
                Setting
              </p>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    navigate("/profile")
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-white/10 active:scale-[0.99]",
                    isActive("/profile")
                      ? "bg-[#2563EB] text-white shadow-[0_0_14px_rgba(37,99,235,0.4)]"
                      : "text-white/85"
                  )}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  Pengaturan
                </button>
              </div>
            </div>
            <div className="my-2 h-px bg-white/10" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 active:scale-[0.99]"
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
