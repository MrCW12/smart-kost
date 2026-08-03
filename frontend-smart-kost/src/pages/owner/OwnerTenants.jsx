import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenantApi, propertyApi, roomApi, utilityApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingButton } from "@/components/shared/loading-button"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { StatusBadge } from "@/components/shared/status-badge"
import { useDebounce } from "@/hooks/useDebounce"
import { usePermission } from "@/hooks/usePermission"
import { formatCurrency } from "@/lib/utils"
import { Pencil, Trash2, Plus, LogOut, Zap, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PaginationNav } from "@/components/shared/pagination-nav"

export default function OwnerTenants() {
  const { has } = usePermission()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false)
  const [readingsDialogOpen, setReadingsDialogOpen] = useState(false)
  const [readingsTenant, setReadingsTenant] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split("T")[0])
  const [checkoutError, setCheckoutError] = useState("")
  const [checkoutForm, setCheckoutForm] = useState({
    final_electricity_reading: "",
    final_water_reading: "",
    additional_charges: [],
  })
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState({
    name: "", nik: "", phone: "", email: "", address: "", occupation: "",
    emergency_contact: "", emergency_phone: "", notes: "",
    property_id: "", room_id: "", start_date: "", monthly_price: "",
    deposit_amount: "", payment_day: "1",
    initial_electricity_reading: "", initial_water_reading: "",
  })
  const debouncedSearch = useDebounce(search)
  const queryClient = useQueryClient()

  const { data: properties } = useQuery({
    queryKey: ["properties-list"],
    queryFn: () => propertyApi.list({ per_page: 100 }).then((res) => res.data.data),
  })

  const { data: availableRooms } = useQuery({
    queryKey: ["available-rooms", form.property_id],
    queryFn: () => form.property_id ? roomApi.list(form.property_id, { status: "available", per_page: 100 }).then((res) => res.data.data) : [],
    enabled: !!form.property_id,
  })

  const { data: tenantReadings } = useQuery({
    queryKey: ["tenant-readings", selected?.active_contract?.room_id, selected?.active_contract?.id],
    queryFn: async () => {
      // Try readings by contract_id first
      const byContract = await utilityApi.listReadings({ contract_id: selected?.active_contract?.id }).then((res) => res.data.data);
      if (byContract && byContract.length > 0) return byContract;
      // Fallback: latest readings for the room
      return utilityApi.listReadings({ room_id: selected?.active_contract?.room_id, per_page: 100 }).then((res) => res.data.data);
    },
    enabled: !!selected?.active_contract?.room_id && checkoutDialogOpen,
  })

  const { data: viewTenantReadings, isLoading: loadingTenantReadings } = useQuery({
    queryKey: ["tenant-readings-view", readingsTenant?.active_contract?.room_id, readingsTenant?.active_contract?.id],
    queryFn: async () => {
      const byContract = await utilityApi.listReadings({ contract_id: readingsTenant?.active_contract?.id }).then((res) => res.data.data);
      if (byContract && byContract.length > 0) return byContract;
      return utilityApi.listReadings({ room_id: readingsTenant?.active_contract?.room_id, per_page: 100 }).then((res) => res.data.data);
    },
    enabled: !!readingsTenant?.active_contract?.room_id && readingsDialogOpen,
  })

  const { data: editReadings } = useQuery({
    queryKey: ["tenant-edit-readings", selected?.active_contract?.id],
    queryFn: async () => {
      const byContract = await utilityApi.listReadings({ contract_id: selected?.active_contract?.id }).then((res) => res.data.data);
      if (byContract && byContract.length > 0) return byContract;
      return utilityApi.listReadings({ room_id: selected?.active_contract?.room_id, per_page: 100 }).then((res) => res.data.data);
    },
    enabled: !!selected?.id && dialogOpen && !!selected?.active_contract?.id,
  })

  useEffect(() => {
    if (selected && dialogOpen && editReadings) {
      const elec = editReadings.find((r) => r.utility_setting?.type === 'electricity')
      const water = editReadings.find((r) => r.utility_setting?.type === 'water')
      setForm((prev) => ({
        ...prev,
        initial_electricity_reading: elec?.reading_start?.toString() || "",
        initial_water_reading: water?.reading_start?.toString() || "",
      }))
    }
  }, [selected, dialogOpen, editReadings])

  const { data: propertySettings } = useQuery({
    queryKey: ["property-settings", selected?.active_contract?.property_id],
    queryFn: () => utilityApi.getSettings(selected?.active_contract?.property_id).then((res) => res.data.data),
    enabled: !!selected?.active_contract?.property_id && checkoutDialogOpen,
  })

  const { data, isLoading } = useQuery({
    queryKey: ["tenants", debouncedSearch, page, statusFilter],
    queryFn: () => {
      const params = { search: debouncedSearch, page, per_page: 15 }
      if (statusFilter) params.status = statusFilter
      return tenantApi.list(params).then((res) => res.data)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => tenantApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tenants"])
      queryClient.invalidateQueries(["available-rooms"])
      setDialogOpen(false)
      setFormErrors({})
      resetForm()
    },
    onError: (error) => {
      const response = error.response?.data
      if (response?.errors) {
        setFormErrors(response.errors)
      } else {
        setFormErrors({ general: response?.message || "Terjadi kesalahan" })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tenantApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tenants"])
      setDialogOpen(false)
      setSelected(null)
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: ({ id, data }) => tenantApi.checkout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tenants"])
      queryClient.invalidateQueries(["available-rooms"])
      setCheckoutDialogOpen(false)
      setSelected(null)
      setCheckoutError("")
      setCheckoutForm({ final_electricity_reading: "", final_water_reading: "", additional_charges: [] })
    },
    onError: (error) => {
      setCheckoutError(error.response?.data?.message || "Terjadi kesalahan")
    },
  })

  const checkoutPreviewQuery = useQuery({
    queryKey: ["checkout-preview", selected?.id, checkoutForm.final_electricity_reading, checkoutForm.final_water_reading, checkoutForm.additional_charges],
    queryFn: () => {
      const params = {}
      if (checkoutForm.final_electricity_reading) params.final_electricity_reading = checkoutForm.final_electricity_reading
      if (checkoutForm.final_water_reading) params.final_water_reading = checkoutForm.final_water_reading
      if (checkoutForm.additional_charges.length > 0) {
        params.additional_charges = checkoutForm.additional_charges
          .filter(c => c.description && c.amount)
          .map(c => ({ description: c.description, amount: Number(c.amount) }))
      }
      return tenantApi.checkoutPreview(selected?.id, params).then((res) => res.data.data)
    },
    enabled: !!selected?.id && checkoutDialogOpen,
  })

  const refundData = checkoutPreviewQuery.data

  const deleteMutation = useMutation({
    mutationFn: (id) => tenantApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["tenants"])
      setDeleteDialogOpen(false)
      setSelected(null)
    },
  })

  const resetForm = () => setForm({
    name: "", nik: "", phone: "", email: "", address: "", occupation: "",
    emergency_contact: "", emergency_phone: "", notes: "",
    property_id: "", room_id: "", start_date: "", monthly_price: "",
    deposit_amount: "", payment_day: "1",
    initial_electricity_reading: "", initial_water_reading: "",
  })

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    const tenantFields = {
      name: form.name,
      nik: form.nik,
      phone: form.phone,
      email: form.email,
      address: form.address,
      occupation: form.occupation,
      emergency_contact: form.emergency_contact,
      emergency_phone: form.emergency_phone,
      notes: form.notes,
    }
    if (form.initial_electricity_reading) tenantFields.initial_electricity_reading = Number(form.initial_electricity_reading)
    if (form.initial_water_reading) tenantFields.initial_water_reading = Number(form.initial_water_reading)

    if (selected) {
      updateMutation.mutate({ id: selected.id, data: tenantFields })
      return
    }

    createMutation.mutate({
      ...tenantFields,
      property_id: form.property_id,
      room_id: form.room_id,
      start_date: form.start_date,
      monthly_price: Number(form.monthly_price),
      deposit_amount: Number(form.deposit_amount || 0),
      payment_day: Number(form.payment_day),
    })
  }

  const handleCheckout = () => {
    const payload = { checkout_date: checkoutDate }
    if (checkoutForm.final_electricity_reading) payload.final_electricity_reading = Number(checkoutForm.final_electricity_reading)
    if (checkoutForm.final_water_reading) payload.final_water_reading = Number(checkoutForm.final_water_reading)
    if (checkoutForm.additional_charges.length > 0) {
      payload.additional_charges = checkoutForm.additional_charges
        .filter(c => c.description && c.amount)
        .map(c => ({ description: c.description, amount: Number(c.amount) }))
    }
    checkoutMutation.mutate({ id: selected?.id, data: payload })
  }

  const openCheckin = () => {
    setSelected(null)
    resetForm()
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      name: item.name || "", nik: item.nik || "", phone: item.phone || "",
      email: item.email || "", address: item.address || "", occupation: item.occupation || "",
      emergency_contact: item.emergency_contact || "", emergency_phone: item.emergency_phone || "",
      notes: item.notes || "",
      property_id: "", room_id: "", start_date: "", monthly_price: "",
      deposit_amount: "", payment_day: "1",
    })
    setDialogOpen(true)
  }

  if (isLoading) return <LoadingPage />
  const items = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari tenant..." />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="checked_out">Sudah Checkout</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {has("tenant.check-in") && (
          <Button onClick={openCheckin}>
            <Plus className="mr-2 h-4 w-4" />
            Check-in Tenant
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Kamar</TableHead>
              <TableHead>Properti</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState title="Tidak ada tenant" />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.nik || '-'}</TableCell>
                  <TableCell>{item.phone || '-'}</TableCell>
                  <TableCell>{item.active_contract?.room_number || '-'}</TableCell>
                  <TableCell>{item.active_contract?.property_name || '-'}</TableCell>
                  <TableCell><StatusBadge type="tenant" status={item.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.active_contract && (
                        <Button variant="ghost" size="icon" title="Lihat Standing Utilitas" onClick={() => { setReadingsTenant(item); setReadingsDialogOpen(true) }}>
                          <Eye className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                      {item.status === 'active' && has("tenant.check-out") && (
                        <Button variant="ghost" size="icon" title="Check-out" onClick={() => { setSelected(item); setCheckoutDialogOpen(true) }}>
                          <LogOut className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      {has("tenant.update") && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {item.status !== 'active' && has("tenant.delete") && (
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

      {/* Check-in / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Tenant" : "Check-in Tenant Baru"}</DialogTitle>
            <DialogDescription>{selected ? "Update data tenant" : "Isi data tenant dan pilih kamar"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {formErrors.general && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formErrors.general}
              </div>
            )}
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Data Diri</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label>NIK *</Label>
                <Input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} required />
                {formErrors.nik && <p className="text-xs text-destructive">{formErrors.nik[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telepon *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alamat *</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              {formErrors.address && <p className="text-xs text-destructive">{formErrors.address[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pekerjaan</Label>
                <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Kontak Darurat</Label>
                <Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
              </div>
            </div>

            {selected && (
              <>
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2 pt-2">Informasi Kamar & Kontrak</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Properti: </span>
                    <span className="font-medium">{selected.active_contract?.property_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kamar: </span>
                    <span className="font-medium">{selected.active_contract?.room_number || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Harga/Bulan: </span>
                    <span className="font-medium">{formatCurrency(selected.active_contract?.monthly_price || 0)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mulai: </span>
                    <span className="font-medium">{selected.active_contract?.start_date || '-'}</span>
                  </div>
                </div>

                {tenantReadings && tenantReadings.length > 0 && (
                  <>
                    <h4 className="font-medium text-sm text-muted-foreground border-b pb-2 pt-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Meter Utilitas (Standing Awal)
                    </h4>
                    <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                      {tenantReadings.map((r) => (
                        <div key={r.id} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">{r.utility_setting?.name || r.name}</span>
                            <span className="text-muted-foreground ml-1">({r.utility_setting?.unit || '-'})</span>
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
              </>
            )}

            {!selected && (
              <>
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2 pt-2">Data Kamar & Kontrak</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Properti *</Label>
                    <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v, room_id: "" })}>
                      <SelectTrigger><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                      <SelectContent>
                        {(properties || []).map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.property_id && <p className="text-xs text-destructive">{formErrors.property_id[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Kamar *</Label>
                    <Select value={form.room_id} onValueChange={(v) => {
                      const room = availableRooms?.find(r => r.id.toString() === v)
                      setForm({ ...form, room_id: v, monthly_price: room?.price?.toString() || form.monthly_price })
                    }}>
                      <SelectTrigger><SelectValue placeholder="Pilih kamar" /></SelectTrigger>
                      <SelectContent>
                        {(availableRooms || []).map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>Room {r.number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.room_id && <p className="text-xs text-destructive">{formErrors.room_id[0]}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai *</Label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                    {formErrors.start_date && <p className="text-xs text-destructive">{formErrors.start_date[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Harga/Bulan *</Label>
                    <Input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} required />
                    {formErrors.monthly_price && <p className="text-xs text-destructive">{formErrors.monthly_price[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Deposit</Label>
                    <Input type="number" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2 pt-2">{selected ? "Meter Awal (Standing Utilitas)" : "Meter Awal (Check-in)"}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Standing Awal Listrik (kWh)</Label>
                <Input type="number" step="0.01" value={form.initial_electricity_reading} onChange={(e) => setForm({ ...form, initial_electricity_reading: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Standing Awal Air (m³)</Label>
                <Input type="number" step="0.01" value={form.initial_water_reading} onChange={(e) => setForm({ ...form, initial_water_reading: e.target.value })} placeholder="0" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <LoadingButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {selected ? "Update" : "Check-in"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={(open) => { setCheckoutDialogOpen(open); setCheckoutError(""); if (!open) setCheckoutForm({ final_electricity_reading: "", final_water_reading: "", additional_charges: [] }) }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check-out Tenant</DialogTitle>
            <DialogDescription>Check-out <strong>{selected?.name}</strong></DialogDescription>
          </DialogHeader>
          {checkoutError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {checkoutError}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal Check-out *</Label>
              <Input type="date" value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} />
            </div>

            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2 pt-2">Meter Akhir (Check-out)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Standing Akhir Listrik (kWh)</Label>
                {(() => {
                  const elecReading = tenantReadings?.find((r) => r.utility_setting?.type === 'electricity');
                  const elecSetting = propertySettings?.find((s) => s.type === 'electricity');
                  const start = elecReading ? Number(elecReading.reading_start) : 0;
                  const subsidy = elecSetting?.min_usage ?? elecReading?.utility_setting?.min_usage ?? 0;
                  return (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Awal: <span className="font-medium text-foreground">{start} kWh</span></p>
                      {subsidy > 0 && <p className="text-green-600">Subsidi: {Number(subsidy)} kWh</p>}
                    </div>
                  );
                })()}
                <Input type="number" step="0.01" value={checkoutForm.final_electricity_reading} onChange={(e) => setCheckoutForm({ ...checkoutForm, final_electricity_reading: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Standing Akhir Air (m³)</Label>
                {(() => {
                  const waterReading = tenantReadings?.find((r) => r.utility_setting?.type === 'water');
                  const waterSetting = propertySettings?.find((s) => s.type === 'water');
                  const start = waterReading ? Number(waterReading.reading_start) : 0;
                  const subsidy = waterSetting?.min_usage ?? waterReading?.utility_setting?.min_usage ?? 0;
                  return (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Awal: <span className="font-medium text-foreground">{start} m³</span></p>
                      {subsidy > 0 && <p className="text-green-600">Subsidi: {Number(subsidy)} m³</p>}
                    </div>
                  );
                })()}
                <Input type="number" step="0.01" value={checkoutForm.final_water_reading} onChange={(e) => setCheckoutForm({ ...checkoutForm, final_water_reading: e.target.value })} placeholder="0" />
              </div>
            </div>

            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2 pt-2">Tagihan Tambahan</h4>
            {checkoutForm.additional_charges.length > 0 && (
              <div className="space-y-2">
                {checkoutForm.additional_charges.map((charge, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Deskripsi" value={charge.description} onChange={(e) => {
                        const updated = [...checkoutForm.additional_charges]
                        updated[idx] = { ...updated[idx], description: e.target.value }
                        setCheckoutForm({ ...checkoutForm, additional_charges: updated })
                      }} />
                    </div>
                    <div className="w-32 space-y-1">
                      <Input type="number" placeholder="Jumlah" value={charge.amount} onChange={(e) => {
                        const updated = [...checkoutForm.additional_charges]
                        updated[idx] = { ...updated[idx], amount: e.target.value }
                        setCheckoutForm({ ...checkoutForm, additional_charges: updated })
                      }} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => {
                      const updated = checkoutForm.additional_charges.filter((_, i) => i !== idx)
                      setCheckoutForm({ ...checkoutForm, additional_charges: updated })
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => setCheckoutForm({ ...checkoutForm, additional_charges: [...checkoutForm.additional_charges, { description: "", amount: "" }] })}>
              + Tambah Tagihan
            </Button>

            {refundData && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <h4 className="font-medium text-sm border-b pb-2">Perhitungan Pengembalian Deposit</h4>
                <div className="flex justify-between text-sm">
                  <span>Deposit</span>
                  <span className="font-medium">{formatCurrency(refundData.deposit_amount)}</span>
                </div>
                {refundData.utility_costs?.length > 0 && (
                  <>
                    <div className="text-sm text-muted-foreground">Biaya Utilitas (Listrik + Air)</div>
                    {refundData.utility_costs.map((uc) => (
                      <div key={uc.utility_setting_id} className="flex justify-between text-sm pl-4">
                        <span>
                          {uc.name}: ({Number(uc.reading_end)} - {Number(uc.reading_start)}) = {Number(uc.usage)} {uc.unit}
                          {uc.subsidy > 0 && <span className="text-green-600"> - subsidi {Number(uc.subsidy)} {uc.unit}</span>}
                          {' '}= {Number(uc.billable_usage)} {uc.unit} × {formatCurrency(uc.rate)}
                        </span>
                        <span className="text-destructive">-{formatCurrency(uc.cost)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span>Total Biaya Utilitas</span>
                      <span className="text-destructive font-medium">-{formatCurrency(refundData.total_utility_cost)}</span>
                    </div>
                  </>
                )}
                {refundData.total_additional_charges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tagihan Tambahan</span>
                    <span className="text-destructive font-medium">-{formatCurrency(refundData.total_additional_charges)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                  {refundData.refund_amount > 0 ? (
                    <>
                      <span className="text-green-600">Jumlah Dikembalikan</span>
                      <span className="text-green-600">{formatCurrency(refundData.refund_amount)}</span>
                    </>
                  ) : refundData.remaining_owed > 0 ? (
                    <>
                      <span className="text-destructive">Sisa Hutang Tenant</span>
                      <span className="text-destructive">{formatCurrency(refundData.remaining_owed)}</span>
                    </>
                  ) : (
                    <>
                      <span>Lunas (Deposit = Potongan)</span>
                      <span>Rp 0</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)}>Batal</Button>
            <LoadingButton loading={checkoutMutation.isPending} onClick={handleCheckout}>
              Check-out
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standing Utilitas Dialog */}
      <Dialog open={readingsDialogOpen} onOpenChange={setReadingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Standing Utilitas</DialogTitle>
            <DialogDescription>
              {readingsTenant?.name} - {readingsTenant?.active_contract?.property_name || ''} Room {readingsTenant?.active_contract?.room_number || '-'}
            </DialogDescription>
          </DialogHeader>
          {loadingTenantReadings ? (
            <LoadingPage />
          ) : viewTenantReadings && viewTenantReadings.length > 0 ? (
            <div className="space-y-3">
              {viewTenantReadings.map((r) => (
                <div key={r.id} className="rounded-lg border bg-muted/50 p-3 space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{r.utility_setting?.name || r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Tarif {formatCurrency(r.utility_setting?.rate)}/{r.utility_setting?.unit}
                      {r.utility_setting?.min_usage != null && ` · Min ${Number(r.utility_setting.min_usage)} ${r.utility_setting.unit}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Awal: {Number(r.reading_start)}</span>
                    {r.reading_end != null && <span>Akhir: {Number(r.reading_end)}</span>}
                    {r.usage_amount != null && (
                      <span className="text-primary font-medium">Pakai: {Number(r.usage_amount)} {r.utility_setting?.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada data meter utilitas untuk tenant ini.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReadingsDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Tenant</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus tenant <strong>{selected?.name}</strong>?</DialogDescription>
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
