import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "@/api"
import useAuthStore from "@/stores/authStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/shared/loading-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, UserCircle, KeyRound, Camera } from "lucide-react"

export default function Settings() {
  const { user, fetchMe } = useAuthStore()
  const isOwner = !!user?.owner

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company_name: user?.owner?.company_name || "",
    address: user?.owner?.address || "",
    bank_name: user?.owner?.bank_name || "",
    bank_account_number: user?.owner?.bank_account_number || "",
    bank_account_name: user?.owner?.bank_account_name || "",
  })
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState("")

  const [pw, setPw] = useState({ current_password: "", password: "", password_confirmation: "" })
  const [pwError, setPwError] = useState("")
  const [pwSaved, setPwSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: async () => {
      await fetchMe()
      setSaved("Profil berhasil diperbarui.")
      setTimeout(() => setSaved(""), 3000)
    },
    onError: (err) => {
      const response = err.response?.data
      setError(response?.message || "Terjadi kesalahan")
    },
  })

  const avatarMutation = useMutation({
    mutationFn: (data) => authApi.uploadAvatar(data),
    onSuccess: async () => {
      await fetchMe()
      setAvatarFile(null)
      setAvatarPreview("")
      setSaved("Foto profil berhasil diunggah.")
      setTimeout(() => setSaved(""), 3000)
    },
    onError: (err) => setError(err.response?.data?.message || "Gagal mengunggah foto"),
  })

  const passwordMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      setPw({ current_password: "", password: "", password_confirmation: "" })
      setPwError("")
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 3000)
    },
    onError: (err) => {
      const response = err.response?.data
      setPwError(response?.message || response?.errors?.current_password?.[0] || "Gagal mengubah password")
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")
    const payload = { name: form.name, email: form.email, phone: form.phone }
    if (isOwner) {
      payload.company_name = form.company_name
      payload.address = form.address
      payload.bank_name = form.bank_name
      payload.bank_account_number = form.bank_account_number
      payload.bank_account_name = form.bank_account_name
    }
    mutation.mutate(payload)
  }

  const handleAvatarChange = (e) => {
    const f = e.target.files?.[0] || null
    setAvatarFile(f)
    setAvatarPreview(f ? URL.createObjectURL(f) : "")
  }

  const handleAvatarUpload = (e) => {
    e.preventDefault()
    if (!avatarFile) return
    const formData = new FormData()
    formData.append("file", avatarFile)
    avatarMutation.mutate(formData)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    setPwError("")
    passwordMutation.mutate(pw)
  }

  const role = user?.roles?.[0]?.name || "-"
  const avatarSrc = avatarPreview || user?.avatar_url?.replace(/^https?:\/\/[^/]+/, "")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Profil</h2>
        <p className="text-sm text-muted-foreground">Kelola informasi akun, foto profil, dan password</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {saved}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Akun
          </CardTitle>
          <CardDescription>Email, data diri, dan foto profil Anda. Role: <span className="capitalize font-medium">{role}</span></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAvatarUpload} className="mb-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt={user?.name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl uppercase">
                  {user?.name?.[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Foto Profil</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={handleAvatarChange} className="w-48 cursor-pointer" />
                <LoadingButton type="submit" size="sm" loading={avatarMutation.isPending} disabled={!avatarFile}>
                  <Camera className="mr-1.5 h-4 w-4" />
                  Upload
                </LoadingButton>
              </div>
            </div>
          </form>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>No. HP</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
              </div>
            </div>

            {isOwner && (
              <>
                <div className="pt-2 text-sm font-medium text-muted-foreground border-t">Profil Kost</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nama Kost / Perusahaan</Label>
                    <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Alamat</Label>
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank</Label>
                    <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="cth: BCA" />
                  </div>
                  <div className="space-y-2">
                    <Label>No. Rekening</Label>
                    <Input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Atas Nama Rekening</Label>
                    <Input value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            <LoadingButton type="submit" loading={mutation.isPending}>
              Simpan Perubahan
            </LoadingButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Ubah Password
          </CardTitle>
          <CardDescription>Ganti password akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {pwSaved && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Password berhasil diubah.
            </div>
          )}
          {pwError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {pwError}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Password Lama *</Label>
              <Input type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Password Baru *</Label>
                <Input type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} required placeholder="Minimal 8 karakter" />
              </div>
              <div className="space-y-2">
                <Label>Konfirmasi Password Baru *</Label>
                <Input type="password" value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} required />
              </div>
            </div>
            <LoadingButton type="submit" loading={passwordMutation.isPending} disabled={!pw.current_password || !pw.password || !pw.password_confirmation}>
              Ubah Password
            </LoadingButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

