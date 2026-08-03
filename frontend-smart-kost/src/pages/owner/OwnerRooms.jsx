import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router"
import { roomApi, propertyApi, roomTypeApi, utilityApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/shared/loading-button"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { StatusBadge } from "@/components/shared/status-badge"
import { useDebounce } from "@/hooks/useDebounce"
import { usePermission } from "@/hooks/usePermission"
import { Pencil, Trash2, Plus, Zap, BadgePercent } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PaginationNav } from "@/components/shared/pagination-nav"

const netPrice = (room, discount) => {
  if (!room) return 0
  const price = Number(room.price) || 0
  const pct = Number(discount?.discount_percent) || 0
  const amount = Number(discount?.discount_amount) || 0
  return Math.max(0, price * (1 - pct / 100) - amount)
}

export default function OwnerRooms() {
  const { has } = usePermission()
  const [searchParams, setSearchParams] = useSearchParams()
  const propertyId = searchParams.get("property_id") || ""
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountRoom, setDiscountRoom] = useState(null)
  const [discountForm, setDiscountForm] = useState({ discount_percent: "", discount_amount: "" })
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    number: "", floor: "", room_type_id: "", price: "",
    discount_percent: "", discount_amount: "",
    max_occupants: "1", description: "", is_active: true,
  })
  const debouncedSearch = useDebounce(search)
  const queryClient = useQueryClient()

  const { data: properties } = useQuery({
    queryKey: ["properties-list"],
    queryFn: () => propertyApi.list({ per_page: 100 }).then((res) => res.data.data),
  })

  const { data: roomTypes } = useQuery({
    queryKey: ["room-types", propertyId],
    queryFn: () => propertyId ? roomTypeApi.list(propertyId).then((res) => res.data.data) : [],
    enabled: !!propertyId,
  })

  const { data: utilitySettings } = useQuery({
    queryKey: ["utility-settings", propertyId],
    queryFn: () => utilityApi.getSettings(propertyId).then((res) => res.data.data),
    enabled: !!propertyId,
  })

  const { data: roomReadings } = useQuery({
    queryKey: ["room-readings", selected?.id],
    queryFn: () => utilityApi.listReadings({ room_id: selected?.id, per_page: 100 }).then((res) => res.data.data),
    enabled: !!selected?.id && dialogOpen,
  })

  const { data, isLoading } = useQuery({
    queryKey: ["rooms", propertyId, debouncedSearch, page, statusFilter],
    queryFn: () => {
      if (!propertyId) return { data: [], meta: null }
      const params = { search: debouncedSearch, page, per_page: 15 }
      if (statusFilter) params.status = statusFilter
      return roomApi.list(propertyId, params).then((res) => res.data)
    },
    enabled: !!propertyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => roomApi.create(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["rooms"])
      setDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => roomApi.update(propertyId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["rooms"])
      setDialogOpen(false)
      setSelected(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => roomApi.delete(propertyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(["rooms"])
      setDeleteDialogOpen(false)
      setSelected(null)
    },
  })

  const discountMutation = useMutation({
    mutationFn: ({ id, data }) => roomApi.update(propertyId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["rooms"])
      setDiscountOpen(false)
      setDiscountRoom(null)
    },
  })

  const resetForm = () => setForm({
    number: "", floor: "", room_type_id: "", price: "",
    discount_percent: "", discount_amount: "",
    max_occupants: "1", description: "", is_active: true,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      price: Number(form.price),
      discount_percent: form.discount_percent === "" ? 0 : Number(form.discount_percent),
      discount_amount: form.discount_amount === "" ? 0 : Number(form.discount_amount),
      max_occupants: Number(form.max_occupants),
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
      number: item.number || "", floor: item.floor || "",
      room_type_id: item.room_type_id?.toString() || "",
      price: item.price?.toString() || "",
      discount_percent: item.discount_percent?.toString() || "",
      discount_amount: item.discount_amount?.toString() || "",
      max_occupants: item.max_occupants?.toString() || "1",
      description: item.description || "", is_active: item.is_active,
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
          description="Pilih properti di atas untuk melihat daftar kamar"
          icon={EmptyState}
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
          <SearchInput value={search} onChange={setSearch} placeholder="Cari kamar..." />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="available">Tersedia</SelectItem>
              <SelectItem value="occupied">Terisi</SelectItem>
              <SelectItem value="cleaning">Dalam Pembersihan</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {has("room.create") && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kamar
          </Button>
        )}
      </div>

      {utilitySettings?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {utilitySettings.map((u) => (
            <div key={u.id} className="rounded-lg border bg-card p-3">
              <div className="text-xs text-muted-foreground">{u.name}</div>
              <div className="text-lg font-semibold mt-1">{formatCurrency(u.rate)}<span className="text-xs font-normal text-muted-foreground">/{u.unit}</span></div>
              {u.min_usage != null && (
                <div className="text-xs text-muted-foreground mt-1">Min. pemakaian: {Number(u.min_usage)} {u.unit}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <div className="max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Kamar</TableHead>
              <TableHead>Lantai</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Harga/Bulan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState title="Tidak ada kamar" />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.number}</TableCell>
                  <TableCell>{item.floor || '-'}</TableCell>
                  <TableCell>{item.room_type?.name || '-'}</TableCell>
                  <TableCell>
                    {Number(item.discount_percent) > 0 || Number(item.discount_amount) > 0 ? (
                      <>
                        <span className="text-muted-foreground line-through">{formatCurrency(item.price)}</span>
                        <span className="ml-2 font-medium text-primary">{formatCurrency(item.net_price)}</span>
                      </>
                    ) : (
                      formatCurrency(item.price)
                    )}
                  </TableCell>
                  <TableCell><StatusBadge type="room" status={item.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {has("room.update") && (
                        <Button variant="ghost" size="icon" title="Diskon Harga Sewa" onClick={() => {
                          setDiscountRoom(item)
                          setDiscountForm({
                            discount_percent: item.discount_percent?.toString() || "",
                            discount_amount: item.discount_amount?.toString() || "",
                          })
                          setDiscountOpen(true)
                        }}>
                          <BadgePercent className="h-4 w-4 text-amber-500" />
                        </Button>
                      )}
                      {has("room.update") && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {has("room.delete") && (
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
            <DialogTitle>{selected ? "Edit Kamar" : "Tambah Kamar"}</DialogTitle>
            <DialogDescription>{selected ? "Update data kamar" : "Buat kamar baru"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Kamar *</Label>
                <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Lantai</Label>
                <Input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipe Kamar</Label>
              <Select value={form.room_type_id} onValueChange={(v) => {
                const rt = roomTypes?.find((r) => r.id.toString() === v)
                setForm({ ...form, room_type_id: v, price: rt?.base_price?.toString() || form.price })
              }}>
                <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                <SelectContent>
                  {(roomTypes || []).map((rt) => (
                    <SelectItem key={rt.id} value={rt.id.toString()}>{rt.name} - {formatCurrency(rt.base_price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Harga/Bulan *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="Isi harga custom atau pilih tipe di atas" />
              <p className="text-xs text-muted-foreground">Harga otomatis mengikuti tipe kamar, tapi bisa diubah manual</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Diskon (%)</Label>
                <Input type="number" min="0" max="100" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Diskon (Rp)</Label>
                <Input type="number" min="0" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Occupants</Label>
              <Input type="number" min="1" value={form.max_occupants} onChange={(e) => setForm({ ...form, max_occupants: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {selected && roomReadings && roomReadings.length > 0 && (
              <>
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2 pt-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Meter Utilitas (Standing Awal)
                </h4>
                <div className="space-y-2">
                  {roomReadings.map((r) => (
                    <div key={r.id} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{r.utility_setting?.name || r.name}</span>
                        <span className="text-muted-foreground ml-1">({r.utility_setting?.unit || r.unit || '-'})</span>
                        <div className="text-xs text-muted-foreground">
                          Tarif {formatCurrency(r.utility_setting?.rate)}/{r.utility_setting?.unit}
                          {r.utility_setting?.min_usage != null && ` · Min ${Number(r.utility_setting.min_usage)} ${r.utility_setting.unit}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">Awal: </span>
                        <span className="font-medium">{Number(r.reading_start)}</span>
                        {r.reading_end != null && (
                          <>
                            <span className="text-muted-foreground ml-3">Akhir: </span>
                            <span className="font-medium">{Number(r.reading_end)}</span>
                          </>
                        )}
                        {r.usage_amount != null && (
                          <span className="ml-3 text-primary font-medium">= {Number(r.usage_amount)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
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
            <DialogTitle>Hapus Kamar</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus kamar <strong>{selected?.number}</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <LoadingButton variant="destructive" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selected?.id)}>
              Hapus
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Diskon Harga Sewa</DialogTitle>
            <DialogDescription>Room {discountRoom?.number} - {discountRoom?.room_type?.name || ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga Asli</span>
                <span>{formatCurrency(discountRoom?.price)}</span>
              </div>
              {Number(discountForm.discount_percent) > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Diskon {Number(discountForm.discount_percent)}%</span>
                  <span>-{formatCurrency(Number(discountRoom?.price) * Number(discountForm.discount_percent) / 100)}</span>
                </div>
              )}
              {Number(discountForm.discount_amount) > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Diskon</span>
                  <span>-{formatCurrency(Number(discountForm.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold mt-1 pt-2 border-t">
                <span>Harga Setelah Diskon</span>
                <span>{formatCurrency(netPrice(discountRoom, discountForm))}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Diskon (%)</Label>
                <Input type="number" min="0" max="100" value={discountForm.discount_percent} onChange={(e) => setDiscountForm({ ...discountForm, discount_percent: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Diskon (Rp)</Label>
                <Input type="number" min="0" value={discountForm.discount_amount} onChange={(e) => setDiscountForm({ ...discountForm, discount_amount: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountOpen(false)}>Batal</Button>
            <LoadingButton
              loading={discountMutation.isPending}
              disabled={!discountRoom}
              onClick={() => discountMutation.mutate({
                id: discountRoom.id,
                data: {
                  discount_percent: discountForm.discount_percent === "" ? 0 : Number(discountForm.discount_percent),
                  discount_amount: discountForm.discount_amount === "" ? 0 : Number(discountForm.discount_amount),
                },
              })}
            >
              Simpan
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
