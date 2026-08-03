import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router"
import { roomTypeApi, propertyApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/shared/loading-button"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { useDebounce } from "@/hooks/useDebounce"
import { usePermission } from "@/hooks/usePermission"
import { Pencil, Trash2, Plus, BedDouble } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PaginationNav } from "@/components/shared/pagination-nav"

export default function OwnerRoomTypes() {
  const { has } = usePermission()
  const [searchParams, setSearchParams] = useSearchParams()
  const propertyId = searchParams.get("property_id") || ""
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    name: "", description: "", base_price: "", capacity: "1", facilities: "",
  })
  const debouncedSearch = useDebounce(search)
  const queryClient = useQueryClient()

  const { data: properties } = useQuery({
    queryKey: ["properties-list"],
    queryFn: () => propertyApi.list({ per_page: 100 }).then((res) => res.data.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ["room-types", propertyId, debouncedSearch, page],
    queryFn: () => propertyId
      ? roomTypeApi.list(propertyId, { search: debouncedSearch, page, per_page: 15 }).then((res) => res.data)
      : null,
    enabled: !!propertyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => roomTypeApi.create(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["room-types"])
      setDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => roomTypeApi.update(propertyId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["room-types"])
      setDialogOpen(false)
      setSelected(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => roomTypeApi.delete(propertyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(["room-types"])
      setDeleteDialogOpen(false)
      setSelected(null)
    },
  })

  const resetForm = () => setForm({
    name: "", description: "", base_price: "", capacity: "1", facilities: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const facilitiesArr = form.facilities
      ? form.facilities.split(",").map((f) => f.trim()).filter(Boolean)
      : []
    const payload = {
      name: form.name,
      description: form.description || null,
      base_price: Number(form.base_price),
      capacity: Number(form.capacity),
      facilities: facilitiesArr.length > 0 ? facilitiesArr : null,
    }
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      name: item.name || "",
      description: item.description || "",
      base_price: item.base_price?.toString() || "",
      capacity: item.capacity?.toString() || "1",
      facilities: Array.isArray(item.facilities) ? item.facilities.join(", ") : "",
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setSelected(null)
    resetForm()
    setDialogOpen(true)
  }

  if (!propertyId) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="space-y-2">
            <Label>Pilih Properti</Label>
            <Select value="" onValueChange={(v) => setSearchParams({ property_id: v })}>
              <SelectTrigger className="w-[280px]"><SelectValue placeholder="Pilih properti..." /></SelectTrigger>
              <SelectContent>
                {(properties || []).map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <EmptyState
          title="Pilih properti"
          description="Pilih properti di atas untuk melihat daftar tipe kamar"
          icon={BedDouble}
        />
      </div>
    )
  }

  if (isLoading) return <LoadingPage />

  const items = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={propertyId} onValueChange={(v) => setSearchParams({ property_id: v })}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Properti" /></SelectTrigger>
            <SelectContent>
              {(properties || []).map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SearchInput value={search} onChange={setSearch} placeholder="Cari tipe kamar..." />
        </div>
        {has("room-type.create") && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Tipe Kamar
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Harga/Bulan</TableHead>
              <TableHead>Kapasitas</TableHead>
              <TableHead>Fasilitas</TableHead>
              <TableHead>Jml Kamar</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState title="Belum ada tipe kamar" />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{formatCurrency(item.base_price)}</TableCell>
                  <TableCell>{item.capacity} orang</TableCell>
                  <TableCell>
                    {Array.isArray(item.facilities) && item.facilities.length > 0
                      ? item.facilities.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>{item.rooms_count ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {has("room-type.update") && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {has("room-type.delete") && (
                        <Button variant="ghost" size="icon" onClick={() => { setSelected(item); setDeleteDialogOpen(true) }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Tipe Kamar" : "Tambah Tipe Kamar"}</DialogTitle>
            <DialogDescription>{selected ? "Update data tipe kamar" : "Buat tipe kamar baru"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Tipe *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Standard, VIP, Deluxe" required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat tipe kamar" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga/Bulan *</Label>
                <Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Kapasitas *</Label>
                <Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fasilitas</Label>
              <Input value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} placeholder="AC, WiFi, Kamar Mandi Dalam (koma)" />
              <p className="text-xs text-muted-foreground">Pisahkan dengan koma</p>
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
            <DialogTitle>Hapus Tipe Kamar</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus tipe <strong>{selected?.name}</strong>?</DialogDescription>
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
