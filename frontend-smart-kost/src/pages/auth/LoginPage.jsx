import { useState } from "react"
import { useNavigate } from "react-router"
import useAuthStore from "@/stores/authStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/shared/loading-button"
import { Building2, ReceiptText, BarChart3, ShieldCheck, CheckCircle2 } from "lucide-react"

const features = [
  { icon: Building2, title: "Kelola Properti & Kamar", desc: "Pantau ketersediaan kamar di semua kost Anda" },
  { icon: ReceiptText, title: "Tagihan & Pembayaran", desc: "Buat invoice otomatis dan catat pembayaran tenant" },
  { icon: BarChart3, title: "Laporan Keuangan", desc: "Lihat pendapatan, pengeluaran, dan profit secara real-time" },
]

function BrandPanel() {
  return (
    <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground">
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
          SK
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">SmartKost</p>
          <p className="text-xs text-sidebar-foreground/60">Management System</p>
        </div>
      </div>

      <div className="relative space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold leading-tight">
            Kelola Bisnis Kost
            <br />
            Anda Jadi Lebih Mudah
          </h2>
          <p className="max-w-md text-sm text-sidebar-foreground/70">
            Satu platform untuk mengelola properti, kamar, tenant, tagihan, hingga laporan keuangan kost Anda.
          </p>
        </div>

        {/* Illustration */}
        <div className="relative flex h-52 w-full max-w-md items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="absolute left-8 top-8 flex h-28 w-24 items-end rounded-lg border border-white/15 bg-white/10 p-2 shadow-lg">
            <div className="w-full space-y-1.5">
              <div className="h-8 rounded bg-primary/80" />
              <div className="h-8 rounded bg-primary/60" />
            </div>
          </div>
          <div className="absolute left-1/2 top-6 flex h-32 w-24 -translate-x-1/2 items-end rounded-lg border border-white/15 bg-white/10 p-2 shadow-lg">
            <div className="w-full space-y-1.5">
              <div className="h-8 rounded bg-primary/80" />
              <div className="h-8 rounded bg-primary/60" />
              <div className="h-8 rounded bg-primary/40" />
            </div>
          </div>
          <div className="absolute right-8 top-10 flex h-24 w-24 items-end rounded-lg border border-white/15 bg-white/10 p-2 shadow-lg">
            <div className="w-full space-y-1.5">
              <div className="h-8 rounded bg-primary/80" />
              <div className="h-8 rounded bg-primary/40" />
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-emerald-400" />
            100% Online
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <f.icon className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold leading-tight">{f.title}</p>
              <p className="mt-1 text-xs leading-snug text-sidebar-foreground/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="relative flex items-center gap-2 text-xs text-sidebar-foreground/60">
        <ShieldCheck className="h-4 w-4" />
        Data aman & terpisah untuk setiap pemilik kost
      </p>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    const result = await login({ email, password })
    if (result.success) {
      const user = useAuthStore.getState().user
      const role = user?.roles?.[0]?.name
      const routes = { developer: "/developer", owner: "/owner", admin: "/admin", staff: "/staff" }
      navigate(routes[role] || "/")
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <BrandPanel />

        <div className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            {/* Mobile brand header */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
                SK
              </div>
              <div>
                <p className="text-xl font-bold leading-tight">SmartKost</p>
                <p className="text-xs text-muted-foreground">Management System</p>
              </div>
            </div>

            <Card className="border-border/60 shadow-lg">
              <CardHeader className="text-center lg:text-left">
                <CardTitle className="text-2xl">Selamat Datang!</CardTitle>
                <CardDescription>Masuk ke akun Anda untuk melanjutkan</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@smartkost.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <LoadingButton type="submit" loading={isLoading} className="w-full">
                    Masuk
                  </LoadingButton>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
