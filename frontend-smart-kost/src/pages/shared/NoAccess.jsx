import useAuthStore from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { ShieldX } from "lucide-react"

export default function NoAccess() {
  const { logout } = useAuthStore()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <ShieldX className="mb-4 h-16 w-16 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="mb-2 text-2xl font-semibold">Tidak Ada Akses</h1>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Akun Anda belum memiliki akses ke menu apa pun. Silakan hubungi administrator untuk mengatur hak akses Anda.
      </p>
      <Button variant="outline" onClick={logout}>Keluar</Button>
    </div>
  )
}
