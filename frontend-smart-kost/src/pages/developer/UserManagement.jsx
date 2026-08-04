import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userApi, roleApi, permissionApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingButton } from "@/components/shared/loading-button"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { useDebounce } from "@/hooks/useDebounce"
import { Pencil, Trash2, Plus, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PaginationNav } from "@/components/shared/pagination-nav"

export default function UserManagement() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "staff", owner_id: "", company_name: "", is_active: true })
  const debouncedSearch = useDebounce(search)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["users", debouncedSearch, page],
    queryFn: () => userApi.list({ search: debouncedSearch, page, per_page: 15 }).then((res) => res.data),
  })

  const { data: ownersData } = useQuery({
    queryKey: ["owners"],
    queryFn: () => userApi.owners().then((res) => res.data.data),
  })

  const { data: rolesData } = useQuery({
    queryKey: ["roles-list"],
    queryFn: () => roleApi.list().then((res) => res.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"])
      setDialogOpen(false)
      setForm({ name: "", email: "", phone: "", password: "", role: "staff", owner_id: "", company_name: "", is_active: true })
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Gagal membuat user"
      alert(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"])
      setDialogOpen(false)
      setSelectedUser(null)
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Gagal update user"
      alert(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"])
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Gagal hapus user"
      alert(msg)
    },
  })

  const [accessUser, setAccessUser] = useState(null)
  const [accessDraft, setAccessDraft] = useState([])

  const { data: permissionModules, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionApi.list().then((res) => res.data.data),
  })

  const accessMutation = useMutation({
    mutationFn: (id) => userApi.syncPermissions(id, accessDraft),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"])
      setAccessUser(null)
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Gagal menyimpan hak akses"
      alert(msg)
    },
  })

  const openAccess = (user) => {
    setAccessUser(user)
    setAccessDraft([...(user.effective_permissions || [])])
  }

  const toggleAccessPerm = (perm) => {
    setAccessDraft((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]))
  }

  const toggleAccessModule = (items, checked) => {
    setAccessDraft((prev) => {
      const next = new Set(prev)
      items.forEach((p) => (checked ? next.add(p) : next.delete(p)))
      return [...next]
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.owner_id) delete payload.owner_id
    if (!payload.company_name) delete payload.company_name
    if (!payload.phone) delete payload.phone
    if (selectedUser && !payload.password) delete payload.password
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const openEdit = (user) => {
    setSelectedUser(user)
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.roles?.[0]?.name || "staff",
      owner_id: user.owner_id?.toString() || "",
      company_name: user.owner?.company_name || "",
      is_active: user.is_active,
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setSelectedUser(null)
    setForm({ name: "", email: "", phone: "", password: "", role: "staff", owner_id: "", company_name: "", is_active: true })
    setDialogOpen(true)
  }

  if (isLoading) return <LoadingPage />

  const users = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari user..." />
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState title="Tidak ada user" />
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{user.roles?.[0]?.name}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.roles?.[0]?.name === "owner"
                      ? user.owner?.company_name || "-"
                      : user.assigned_owner?.company_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "destructive"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Kelola Akses" onClick={() => openAccess(user)}>
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true) }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <PaginationNav page={page} lastPage={data?.meta?.last_page} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User" : "Tambah User"}</DialogTitle>
            <DialogDescription>{selectedUser ? "Update data user" : "Buat akun user baru"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxx" />
            </div>
            <div className="space-y-2">
              <Label>{selectedUser ? "Password (leave blank to keep)" : "Password *"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!selectedUser} />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v, owner_id: "", company_name: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(rolesData || []).map((role) => (
                    <SelectItem key={role.id} value={role.name} className="capitalize">
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.role === "owner" && (
              <div className="space-y-2">
                <Label>Nama Usaha Kost *</Label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Contoh: Budi Kost Management" required />
              </div>
            )}
            {(form.role === "admin" || form.role === "staff") && (
              <div className="space-y-2">
                <Label>Owner *</Label>
                <Select value={form.owner_id} onValueChange={(v) => setForm({ ...form, owner_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih owner" /></SelectTrigger>
                  <SelectContent>
                    {(ownersData || []).map((o) => (
                      <SelectItem key={o.id} value={o.id.toString()}>{o.company_name} ({o.user_name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">User ini otomatis mendapat akses ke semua property milik owner</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Label>Active</Label>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <LoadingButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {selectedUser ? "Update" : "Simpan"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.name}</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <LoadingButton variant="destructive" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedUser?.id)}>
              Hapus
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!accessUser} onOpenChange={() => setAccessUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kelola Akses: {accessUser?.name}</DialogTitle>
            <DialogDescription>
              Role: <span className="capitalize">{accessUser?.roles?.[0]?.name}</span>. Centang seluruh akses menu untuk user ini.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto rounded-lg border">
            {permissionsLoading ? (
              <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                Memuat daftar hak akses...
              </div>
            ) : (permissionModules || []).length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Tidak ada hak akses.
              </div>
            ) : (permissionModules || []).map((mod) => {
              const allChecked = mod.items.every((p) => accessDraft.includes(p))
              const someChecked = mod.items.some((p) => accessDraft.includes(p))
              return (
                <div key={mod.module} className="border-b last:border-b-0">
                  <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
                    <span className="text-sm font-semibold">{mod.module}</span>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked }}
                        onChange={(e) => toggleAccessModule(mod.items, e.target.checked)}
                      />
                      Semua
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 py-2">
                    {mod.items.map((p) => (
                      <label key={p} className="flex cursor-pointer items-center gap-2 py-0.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={accessDraft.includes(p)}
                          onChange={() => toggleAccessPerm(p)}
                        />
                        <span className="font-mono text-xs">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-2">
            <div className="mr-auto flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                {accessDraft.length} hak akses dipilih
              </p>
              {accessDraft.length === 0 && (
                <p className="text-xs text-destructive">
                  Jika disimpan, user tidak akan bisa mengakses menu apa pun.
                </p>
              )}
            </div>
            <Button variant="outline" onClick={() => setAccessUser(null)}>Batal</Button>
            <LoadingButton loading={accessMutation.isPending} onClick={() => accessMutation.mutate(accessUser?.id)}>
              Simpan
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
