import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { invoiceApi, propertyApi, contractApi, tenantApi } from "@/api"
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
import { formatCurrency, formatDate } from "@/lib/utils"
import { Eye, Plus, FileText, Trash2, Zap, Receipt } from "lucide-react"
import { PaginationNav } from "@/components/shared/pagination-nav"

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

export default function OwnerInvoices() {
  const { has } = usePermission()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [detailOpen, setDetailOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [genForm, setGenForm] = useState({ property_id: "", month: "", year: "" })
  const debouncedSearch = useDebounce(search)
  const queryClient = useQueryClient()

  // Create invoice form state
  const [createForm, setCreateForm] = useState({
    property_id: "",
    contract_id: "",
    period_month: (new Date().getMonth() + 1).toString(),
    period_year: new Date().getFullYear().toString(),
  })
  const [utilityReadings, setUtilityReadings] = useState([])
  const [additionalCharges, setAdditionalCharges] = useState([])

  const { data: properties } = useQuery({
    queryKey: ["properties-list"],
    queryFn: () => propertyApi.list({ per_page: 100 }).then((res) => res.data.data),
  })

  const { data: tenants } = useQuery({
    queryKey: ["tenants-active", createForm.property_id],
    queryFn: () => {
      const params = { per_page: 100, property_id: createForm.property_id }
      return tenantApi.list(params).then((res) => res.data.data)
    },
    enabled: !!createForm.property_id && createOpen,
  })

  const { data: billingData, isLoading: billingLoading } = useQuery({
    queryKey: ["billing-data", createForm.contract_id, createForm.period_month, createForm.period_year],
    queryFn: () => contractApi.billingData(createForm.contract_id, {
      month: createForm.period_month,
      year: createForm.period_year,
    }).then((res) => res.data.data),
    enabled: !!createForm.contract_id && !!createForm.period_month && !!createForm.period_year && createOpen,
  })

  // Sync billing data into form when loaded
  useEffect(() => {
    if (billingData) {
      if (billingData.readings?.length > 0) {
        setUtilityReadings(billingData.readings.map((r) => ({
          utility_setting_id: r.utility_setting_id,
          type: r.type,
          name: r.name,
          unit: r.unit,
          rate: r.rate,
          min_usage: r.min_usage,
          reading_start: Number(r.reading_start) || 0,
          reading_end: r.reading_end != null ? Number(r.reading_end) : "",
          usage: r.usage,
          amount: r.amount,
        })))
      }
      setAdditionalCharges([])
    }
  }, [billingData])

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", debouncedSearch, page, statusFilter],
    queryFn: () => {
      const params = { search: debouncedSearch, page, per_page: 15 }
      if (statusFilter) params.status = statusFilter
      return invoiceApi.list(params).then((res) => res.data)
    },
  })

  const { data: invoiceDetail } = useQuery({
    queryKey: ["invoice-detail", selected?.id],
    queryFn: () => invoiceApi.get(selected?.id).then((res) => res.data.data),
    enabled: !!selected?.id && detailOpen,
  })

  const generateMutation = useMutation({
    mutationFn: (data) => invoiceApi.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"])
      setGenerateOpen(false)
      setGenForm({ property_id: "", month: "", year: "" })
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => invoiceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"])
      closeCreateDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => invoiceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"])
      setDeleteOpen(false)
      setDeleteTarget(null)
    },
    onError: (err) => {
      alert(err?.response?.data?.message || "Gagal menghapus invoice")
    },
  })

  const closeCreateDialog = () => {
    setCreateOpen(false)
    setCreateForm({ property_id: "", contract_id: "", period_month: (new Date().getMonth() + 1).toString(), period_year: new Date().getFullYear().toString() })
    setUtilityReadings([])
    setAdditionalCharges([])
  }

  const handleReadingChange = (index, field, value) => {
    setUtilityReadings((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value === "" ? "" : Number(value) }
      return next
    })
  }

  const addCharge = () => {
    setAdditionalCharges((prev) => [...prev, { description: "", amount: "" }])
  }

  const removeCharge = (index) => {
    setAdditionalCharges((prev) => prev.filter((_, i) => i !== index))
  }

  const handleChargeChange = (index, field, value) => {
    setAdditionalCharges((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const calcReadingAmount = (r) => {
    const start = Number(r.reading_start) || 0
    const end = Number(r.reading_end) || 0
    const usage = end - start
    const minUsage = Number(r.min_usage) || 0
    const billable = Math.max(0, usage - minUsage)
    return billable > 0 ? billable * (Number(r.rate) || 0) : 0
  }

  const calcReadingUsage = (r) => {
    const start = Number(r.reading_start) || 0
    const end = Number(r.reading_end) || 0
    return end - start
  }

  const rentAmount = Number(billingData?.contract?.monthly_price) || 0
  const totalUtility = utilityReadings.reduce((sum, r) => sum + calcReadingAmount(r), 0)
  const totalCharges = additionalCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  const grandTotal = rentAmount + totalUtility + totalCharges

  const handleCreateSubmit = () => {
    const payload = {
      contract_id: Number(createForm.contract_id),
      period_month: Number(createForm.period_month),
      period_year: Number(createForm.period_year),
      utility_readings: utilityReadings
        .filter((r) => r.reading_end !== "")
        .map((r) => ({
          utility_setting_id: Number(r.utility_setting_id),
          reading_start: Number(r.reading_start),
          reading_end: Number(r.reading_end),
        })),
      additional_charges: additionalCharges
        .filter((c) => c.description && c.amount)
        .map((c) => ({
          description: c.description,
          amount: Number(c.amount),
        })),
    }
    createMutation.mutate(payload)
  }

  const hasExistingInvoice = billingData?.existing_invoice

  if (isLoading) return <LoadingPage />
  const items = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari invoice..." />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="unpaid">Belum Bayar</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="overdue">Jatuh Tempo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {has("invoice.generate") && (
            <Button onClick={() => setGenerateOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Generate Massal
            </Button>
          )}
          {has("invoice.generate") && (
            <Button onClick={() => setCreateOpen(true)}>
              <Receipt className="mr-2 h-4 w-4" />
              Buat Tagihan
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Properti</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState title="Tidak ada invoice" icon={FileText} />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.invoice_number}</TableCell>
                  <TableCell>{item.tenant?.name || '-'}</TableCell>
                  <TableCell>{item.property?.name || '-'}</TableCell>
                  <TableCell>{MONTHS[item.period_month - 1]} {item.period_year}</TableCell>
                  <TableCell>{formatCurrency(item.total_amount)}</TableCell>
                  <TableCell><StatusBadge type="invoice" status={item.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(item); setDetailOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!['paid', 'partial'].includes(item.status) && has("invoice.cancel") && (
                        <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(item); setDeleteOpen(true) }}>
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

      {/* ==================== BUAT TAGIHAN DIALOG ==================== */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) closeCreateDialog(); else setCreateOpen(true) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Tagihan</DialogTitle>
            <DialogDescription>Buat tagihan manual untuk satu tenant</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step 1: Property + Tenant + Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Properti *</Label>
                <Select value={createForm.property_id} onValueChange={(v) => setCreateForm({ ...createForm, property_id: v, contract_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                  <SelectContent>
                    {(properties || []).map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tenant / Kamar *</Label>
                <Select value={createForm.contract_id} onValueChange={(v) => setCreateForm({ ...createForm, contract_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih tenant" /></SelectTrigger>
                  <SelectContent>
                    {(tenants || []).map((t) => (
                      <SelectItem key={t.id} value={t.active_contract?.id?.toString() || ""}>
                        {t.name} — Kamar {t.active_contract?.room_number || '-'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Periode Bulan *</Label>
                <Select value={createForm.period_month} onValueChange={(v) => setCreateForm({ ...createForm, period_month: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Periode Tahun *</Label>
                <Input type="number" value={createForm.period_year} onChange={(e) => setCreateForm({ ...createForm, period_year: e.target.value })} />
              </div>
            </div>

            {hasExistingInvoice && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                Invoice <strong>{hasExistingInvoice.invoice_number}</strong> sudah ada untuk periode ini ({formatCurrency(hasExistingInvoice.total_amount)}).
              </div>
            )}

            {billingLoading && createForm.contract_id && <LoadingPage />}

            {/* Step 2: Billing Data */}
            {billingData && !hasExistingInvoice && (
              <>
                {/* Sewa */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Sewa Kamar</p>
                      <p className="font-medium">{billingData.contract?.room?.number} — {billingData.contract?.property?.name}</p>
                    </div>
                    <p className="font-bold text-lg">{formatCurrency(rentAmount)}</p>
                  </div>
                </div>

                {/* Utility Readings */}
                {utilityReadings.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-sm">Meter Utilitas</h4>
                    </div>
                    {utilityReadings.map((r, idx) => (
                      <div key={r.utility_setting_id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{r.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">({formatCurrency(r.rate)}/{r.unit})</span>
                          </div>
                          {r.reading_end !== "" && (
                            <span className="font-bold">{formatCurrency(calcReadingAmount(r))}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Meter Akhir *</Label>
                            <Input
                              type="number"
                              min="0"
                              value={r.reading_end}
                              onChange={(e) => handleReadingChange(idx, "reading_end", e.target.value)}
                              placeholder="Input meter akhir"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Meter Awal</Label>
                            <Input
                              type="number"
                              min="0"
                              value={r.reading_start}
                              onChange={(e) => handleReadingChange(idx, "reading_start", e.target.value)}
                              readOnly
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Pemakaian</Label>
                            <div className="h-9 px-3 flex items-center text-sm font-medium bg-muted rounded-md">
                              {r.reading_end !== "" ? (() => {
                                const usage = calcReadingUsage(r)
                                const minUsage = Number(r.min_usage) || 0
                                if (minUsage > 0) {
                                  return <span>{usage} {r.unit} - subsidi {minUsage} {r.unit} = {Math.max(0, usage - minUsage)} {r.unit} × {formatCurrency(r.rate)}</span>
                                }
                                return <span>{usage} {r.unit} × {formatCurrency(r.rate)}</span>
                              })() : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Charges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Biaya Tambahan (Opsional)</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addCharge}>
                      <Plus className="mr-1 h-3 w-3" /> Tambah
                    </Button>
                  </div>
                  {additionalCharges.length > 0 && (
                    <div className="space-y-2">
                      {additionalCharges.map((c, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Deskripsi</Label>
                            <Input
                              value={c.description}
                              onChange={(e) => handleChargeChange(idx, "description", e.target.value)}
                              placeholder="Contoh: Denda keterlambatan"
                            />
                          </div>
                          <div className="w-36 space-y-1">
                            <Label className="text-xs">Jumlah (Rp)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={c.amount}
                              onChange={(e) => handleChargeChange(idx, "amount", e.target.value)}
                            />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeCharge(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sewa Kamar</span>
                    <span>{formatCurrency(rentAmount)}</span>
                  </div>
                  {utilityReadings.map((r) => r.reading_end !== "" && (
                    <div key={r.utility_setting_id} className="flex justify-between text-sm">
                      <span>{r.name} ({Number(r.reading_end)} - {Number(r.reading_start)} = {calcReadingUsage(r)} {r.unit} × {formatCurrency(r.rate)})</span>
                      <span>{formatCurrency(calcReadingAmount(r))}</span>
                    </div>
                  ))}
                  {additionalCharges.filter((c) => c.description && c.amount).map((c, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{c.description}</span>
                      <span>{formatCurrency(Number(c.amount))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total Tagihan</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCreateDialog}>Batal</Button>
            <LoadingButton
              loading={createMutation.isPending}
              disabled={!createForm.contract_id || hasExistingInvoice}
              onClick={handleCreateSubmit}
            >
              Buat Tagihan
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== GENERATE MASSAL DIALOG ==================== */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice Massal</DialogTitle>
            <DialogDescription>Buat invoice bulanan untuk semua tenant aktif di properti</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Properti *</Label>
              <Select value={genForm.property_id} onValueChange={(v) => setGenForm({ ...genForm, property_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                <SelectContent>
                  {(properties || []).map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bulan *</Label>
                <Select value={genForm.month} onValueChange={(v) => setGenForm({ ...genForm, month: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih bulan" /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tahun *</Label>
                <Input type="number" value={genForm.year} onChange={(e) => setGenForm({ ...genForm, year: e.target.value })} placeholder="2026" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Batal</Button>
            <LoadingButton loading={generateMutation.isPending} onClick={() => generateMutation.mutate(genForm)}>
              Generate
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== INVOICE DETAIL DIALOG ==================== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Invoice</DialogTitle>
            <DialogDescription>{invoiceDetail?.invoice_number}</DialogDescription>
          </DialogHeader>
          {invoiceDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Tenant:</span> <span className="font-medium">{invoiceDetail.tenant?.name}</span></div>
                <div><span className="text-muted-foreground">Properti:</span> <span className="font-medium">{invoiceDetail.property?.name}</span></div>
                <div><span className="text-muted-foreground">Kamar:</span> <span className="font-medium">{invoiceDetail.room?.number}</span></div>
                <div><span className="text-muted-foreground">Periode:</span> <span className="font-medium">{MONTHS[invoiceDetail.period_month - 1]} {invoiceDetail.period_year}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge type="invoice" status={invoiceDetail.status} /></div>
                <div><span className="text-muted-foreground">Jatuh Tempo:</span> <span className="font-medium">{formatDate(invoiceDetail.due_date)}</span></div>
              </div>
              <div className="border-t pt-3">
                <h4 className="font-medium text-sm mb-2">Item Invoice</h4>
                {invoiceDetail.items?.length > 0 ? (
                  <div className="space-y-2">
                    {invoiceDetail.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground ml-1">— {item.description}</span>
                        </div>
                        <span className="font-medium whitespace-nowrap">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Tidak ada item</p>
                )}
                <div className="flex justify-between font-bold text-sm border-t mt-2 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(invoiceDetail.total_amount)}</span>
                </div>
              </div>
            </div>
          ) : (
            <LoadingPage />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Invoice</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus invoice <strong>{deleteTarget?.invoice_number}</strong>?
              {deleteTarget?.status === 'unpaid' && " Invoice ini belum dibayar."}
              {deleteTarget?.status === 'draft' && " Invoice ini masih draft."}
              {deleteTarget?.status === 'pending' && " Invoice ini memiliki pembayaran pending."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <LoadingButton
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget?.id)}
            >
              Hapus
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
