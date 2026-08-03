import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { propertyApi, utilityApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/shared/loading-button"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { formatCurrency } from "@/lib/utils"
import { usePermission } from "@/hooks/usePermission"
import { Pencil, Trash2, Plus, Zap } from "lucide-react"
import { PaginationNav } from "@/components/shared/pagination-nav"

const PAGE_SIZE = 15

const UTILITY_TYPES = [
  { value: "electricity", label: "Listrik" },
  { value: "water", label: "Air" },
  { value: "internet", label: "Internet" },
  { value: "parking", label: "Parkir" },
  { value: "garbage", label: "Sampah" },
  { value: "other", label: "Lainnya" },
]

export default function OwnerUtilitySettings() {
  const { has } = usePermission()
  const [propertyFilter, setPropertyFilter] = useState("")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    type: "", name: "", unit: "", rate: "", min_usage: "0",
  })
  const queryClient = useQueryClient()

  const { data: properties } = useQuery({
    queryKey: ["properties-list"],
    queryFn: () => propertyApi.list({ per_page: 100 }).then((res) => res.data.data),
  })

  const { data: utilitySettings, isLoading } = useQuery({
    queryKey: ["utility-settings", propertyFilter],
    queryFn: () => propertyFilter ? utilityApi.getSettings(propertyFilter).then((res) => res.data.data) : [],
    enabled: !!propertyFilter,
  })

  const createMutation = useMutation({
    mutationFn: (data) => utilityApi.createSetting(propertyFilter, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["utility-settings", propertyFilter])
      setDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => utilityApi.updateSetting(propertyFilter, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["utility-settings", propertyFilter])
      setDialogOpen(false)
      setSelected(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => utilityApi.deleteSetting(propertyFilter, id),
    onSuccess: () => {
      queryClient.invalidateQueries(["utility-settings", propertyFilter])
      setDeleteDialogOpen(false)
      setSelected(null)
    },
  })

  const resetForm = () => setForm({
    type: "", name: "", unit: "", rate: "", min_usage: "0",
  })

  const handleTypeChange = (type) => {
    const defaults = {
      electricity: { name: "Listrik", unit: "kWh" },
      water: { name: "Air", unit: "m3" },
      internet: { name: "Internet", unit: "bulan" },
      parking: { name: "Parkir", unit: "bulan" },
      garbage: { name: "Sampah", unit: "bulan" },
      other: { name: "", unit: "" },
    }
    const d = defaults[type] || { name: "", unit: "" }
    setForm({ ...form, type, name: d.name, unit: d.unit })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, rate: Number(form.rate), min_usage: Number(form.min_usage || 0) }
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      type: item.type || "",
      name: item.name || "",
      unit: item.unit || "",
      rate: item.rate?.toString() || "",
      min_usage: item.min_usage?.toString() || "0",
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setSelected(null)
    resetForm()
    setDialogOpen(true)
  }

  if (!propertyFilter) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="space-y-2">
            <Label>Pilih Properti</Label>
            <Select value="" onValueChange={setPropertyFilter}>
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
          description="Pilih properti di atas untuk mengatur tarif utilitas"
          icon={Zap}
        />
      </div>
    )
  }

  if (isLoading) return <LoadingPage />

  const items = utilitySettings || []
  const lastPage = Math.ceil(items.length / PAGE_SIZE)
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Properti" /></SelectTrigger>
            <SelectContent>
              {(properties || []).map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {has("utility.setting") && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Tarif
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jenis</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead>Harga/Satuan</TableHead>
              <TableHead>Min. Pemakaian</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState title="Belum ada tarif utilitas" description="Tambahkan tarif listrik, air, internet, dll." icon={Zap} />
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {UTILITY_TYPES.find((t) => t.value === item.type)?.label || item.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{formatCurrency(item.rate)}</TableCell>
                  <TableCell>{item.min_usage || 0} {item.unit}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {has("utility.setting") && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {has("utility.setting") && (
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
      <PaginationNav page={page} lastPage={lastPage} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Tarif Utilitas" : "Tambah Tarif Utilitas"}</DialogTitle>
            <DialogDescription>{selected ? "Update data tarif utilitas" : "Tambahkan tarif baru untuk properti ini"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Utilitas *</Label>
              <Select value={form.type} onValueChange={handleTypeChange} disabled={!!selected}>
                <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                <SelectContent>
                  {UTILITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Satuan *</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required placeholder="kWh, m3, bulan" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga/Satuan (Rp) *</Label>
                <Input type="number" min="0" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Min. Pemakaian</Label>
                <Input type="number" min="0" value={form.min_usage} onChange={(e) => setForm({ ...form, min_usage: e.target.value })} />
              </div>
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
            <DialogTitle>Hapus Tarif</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus tarif <strong>{selected?.name}</strong>?</DialogDescription>
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
