import { useEffect, useState } from "react"
import useAuthStore from "@/stores/authStore"
import useUIStore from "@/stores/uiStore"
import { userApi, notificationApi } from "@/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell, Menu, Building2, Sun, Moon, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router"

export default function Navbar({ title }) {
  const { user, logout } = useAuthStore()
  const { setSidebarOpen, selectedOwnerId, setSelectedOwnerId } = useUIStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notifOpen, setNotifOpen] = useState(false)

  const role = user?.roles?.[0]?.name
  const isDeveloper = role === "developer"
  const hasNotifications = ["developer", "owner", "admin", "staff"].includes(role)

  const { data: ownersData } = useQuery({
    queryKey: ["owners"],
    queryFn: () => userApi.owners().then((res) => res.data.data),
    enabled: isDeveloper,
  })

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list({ per_page: 10 }).then((res) => res.data),
    enabled: hasNotifications,
    refetchInterval: 30000,
  })

  const notifItems = notifications?.data || []
  const unreadCount = notifications?.meta?.unread_count || 0

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  })

  const openNotification = (n) => {
    if (!n.read_at) markReadMutation.mutate(n.id)
    setNotifOpen(false)
    if (role === "staff") {
      navigate("/staff/payments")
    } else if (role === "admin") {
      navigate("/admin/payments")
    } else {
      navigate("/owner/payments")
    }
  }

  const timeAgo = (iso) => {
    if (!iso) return ""
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "baru saja"
    if (mins < 60) return `${mins} mnt lalu`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} jam lalu`
    return `${Math.floor(hours / 24)} hari lalu`
  }

  useEffect(() => {
    if (isDeveloper && ownersData?.length > 0 && !selectedOwnerId) {
      setSelectedOwnerId(ownersData[0].id.toString())
    }
  }, [isDeveloper, ownersData, selectedOwnerId, setSelectedOwnerId])

  const selectedOwner = isDeveloper
    ? ownersData?.find((o) => o.id.toString() === selectedOwnerId)
    : null

  const kostName = isDeveloper
    ? selectedOwner?.company_name || "Pilih Kost"
    : user?.owner?.company_name || user?.assigned_owner?.company_name || "SmartKost"

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Building2 className="h-4 w-4" />
          {isDeveloper ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-sm font-semibold">
                  {kostName}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button> */}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Pilih Kost</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(ownersData || []).map((o) => (
                  <DropdownMenuItem
                    key={o.id}
                    onClick={() => setSelectedOwnerId(o.id.toString())}
                    className={selectedOwnerId === o.id.toString() ? "bg-primary/10 text-primary font-medium" : ""}
                  >
                    <div className="flex flex-col">
                      <span>{o.company_name}</span>
                      <span className="text-xs text-muted-foreground">{o.user_name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span>{kostName}</span>
          )}
        </div>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {hasNotifications && (
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="text-sm">Notifikasi</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-blue-600"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tandai dibaca
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifItems.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Belum ada notifikasi.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifItems.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex flex-col items-start gap-0.5 py-2"
                      onClick={() => openNotification(n)}
                    >
                      <div className="flex w-full items-center gap-2">
                        {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" />}
                        <span className={`text-sm font-medium ${n.read_at ? "text-muted-foreground" : ""}`}>
                          {n.title}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground pl-4">{n.message}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                {user?.avatar_url ? (
                  <AvatarImage src={user.avatar_url.replace(/^https?:\/\/[^/]+/, "")} alt={user?.name} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm uppercase">
                    {user?.name?.[0]}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
