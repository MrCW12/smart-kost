import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { propertyApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/shared/loading-button"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { StatusBadge } from "@/components/shared/status-badge"
import { useDebounce } from "@/hooks/useDebounce"
import { usePermission } from "@/hooks/usePermission"
import { Pencil, Trash2, Plus, DoorOpen, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router"

export default function OwnerProperties() {
  const { has } = usePermission()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    name: "", address: "", city: "", province: "", postal_code: "",
    phone: "", description: "",
  })
  const debouncedSearch = useDebounce(search)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["properties", debouncedSearch, page],
    queryFn: () => propertyApi.list({ search: debouncedSearch, page, per_page: 15 }).then((res) => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => propertyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["properties"])
      setDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => propertyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["properties"])
      setDialogOpen(false)
      setSelected(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => propertyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["properties"])
      setDeleteDialogOpen(false)
      setSelected(null)
    },
  })

  const resetForm = () => setForm({
    name: "", address: "", city: "", province: "", postal_code: "",
    phone: "", description: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      name: item.name || "", address: item.address || "", city: item.city || "",
      province: item.province || "", postal_code: item.postal_code || "",
      phone: item.phone || "", description: item.description || "",
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setSelected(null)
    resetForm()
    setDialogOpen(true)
  }

  if (isLoading) return <LoadingPage />

  const items = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari properti..." />
        {has("property.create") && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Properti
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="col-span-full">
            <EmptyState title="Tidak ada properti" description="Mulai dengan menambahkan properti baru" icon={Building2} />
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border bg-card p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.city}, {item.province}</p>
                </div>
                <Badge variant={item.is_active ? "default" : "destructive"}>
                  {item.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.address}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <DoorOpen className="h-3.5 w-3.5" />
                  {item.rooms_count || 0} kamar
                </span>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/owner/rooms?property_id=${item.id}`)}>
                  <DoorOpen className="mr-1 h-3.5 w-3.5" /> Kamar
                </Button>
                {has("property.update") && (
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {has("property.delete") && (
                  <Button variant="ghost" size="icon" onClick={() => { setSelected(item); setDeleteDialogOpen(true) }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {data?.meta?.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="flex items-center px-3 text-sm">Page {page} of {data?.meta?.last_page}</span>
          <Button variant="outline" size="sm" disabled={page === data?.meta?.last_page} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Properti" : "Tambah Properti"}</DialogTitle>
            <DialogDescription>{selected ? "Update data properti" : "Buat properti baru"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Properti *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Alamat *</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kota *</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Provinsi *</Label>
                <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kode Pos</Label>
                <Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <LoadingButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                Simpan
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Properti</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus <strong>{selected?.name}</strong>? Semua data terkait akan terhapus.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <LoadingButton variant="destructive" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selected?.id)}>
              Hapus
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
