import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { paymentApi, invoiceApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingButton } from "@/components/shared/loading-button"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { StatusBadge } from "@/components/shared/status-badge"
import { usePermission } from "@/hooks/usePermission"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MONTHS } from "@/lib/constants"
import { CheckCircle, XCircle, Plus, Wallet, Receipt, Clock, ArrowRight } from "lucide-react"
import { PAYMENT_METHODS } from "@/lib/constants"
import { PaginationNav } from "@/components/shared/pagination-nav"

export default function OwnerPayments() {
  const { has } = usePermission()
  const [methodFilter, setMethodFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [historyPage, setHistoryPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [pendingNotes, setPendingNotes] = useState("")
  const [confirmMethod, setConfirmMethod] = useState("cash")
  const [notesOpen, setNotesOpen] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState("")
  const [confirmImmediately, setConfirmImmediately] = useState(false)
  const [form, setForm] = useState({
    invoice_id: "", amount: "", payment_method: "cash",
    bank_name: "", bank_account_number: "", reference_number: "",
    payment_date: new Date().toISOString().split("T")[0], notes: "",
  })
  const queryClient = useQueryClient()

  const { data: unpaidInvoices, isLoading: loadingUnpaid } = useQuery({
    queryKey: ["unpaid-invoices"],
    queryFn: () => invoiceApi.list({ status: "unpaid", per_page: 100 }).then((res) => res.data.data),
  })

  const { data: partialInvoices } = useQuery({
    queryKey: ["partial-invoices"],
    queryFn: () => invoiceApi.list({ status: "partial", per_page: 100 }).then((res) => res.data.data),
  })

  const allPendingInvoices = [...(unpaidInvoices || []), ...(partialInvoices || [])]

  const { data: pendingPayments, isLoading: loadingPending } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: () => paymentApi.list({ status: "pending", per_page: 100 }).then((res) => res.data.data),
  })

  const pendingInvoiceIds = new Set((pendingPayments || []).map((p) => p.invoice_id))

  const unpaidFiltered = allPendingInvoices.filter((inv) => !pendingInvoiceIds.has(inv.id))

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["payments-history", methodFilter, searchQuery, historyPage],
    queryFn: () => {
      const params = { page: historyPage, per_page: 15, status: "confirmed" }
      if (methodFilter && methodFilter !== "all") params.payment_method = methodFilter
      if (searchQuery.trim()) params.search = searchQuery.trim()
      return paymentApi.list(params).then((res) => res.data)
    },
  })

  const markPendingMutation = useMutation({
    mutationFn: async ({ invoice, notes }) => {
      await paymentApi.create({
        invoice_id: invoice.id,
        amount: invoice.remaining_amount || invoice.total_amount,
        payment_method: "cash",
        payment_date: new Date().toISOString().split("T")[0],
        notes,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["unpaid-invoices"])
      queryClient.invalidateQueries(["partial-invoices"])
      queryClient.invalidateQueries(["pending-payments"])
      queryClient.invalidateQueries(["payments-history"])
      setPendingOpen(false)
      setPendingNotes("")
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => paymentApi.create({ ...data, confirm: confirmImmediately }),
    onSuccess: () => {
      queryClient.invalidateQueries(["pending-payments"])
      queryClient.invalidateQueries(["unpaid-invoices"])
      queryClient.invalidateQueries(["partial-invoices"])
      queryClient.invalidateQueries(["payments-history"])
      setCreateOpen(false)
      setPayOpen(false)
      setConfirmImmediately(false)
      setForm({
        invoice_id: "", amount: "", payment_method: "cash",
        bank_name: "", bank_account_number: "", reference_number: "",
        payment_date: new Date().toISOString().split("T")[0], notes: "",
      })
    },
  })

  const confirmMutation = useMutation({
    mutationFn: ({ id, payment_method }) => paymentApi.confirm(id, { payment_method }),
    onSuccess: () => {
      queryClient.invalidateQueries(["pending-payments"])
      queryClient.invalidateQueries(["payments-history"])
      queryClient.invalidateQueries(["unpaid-invoices"])
      queryClient.invalidateQueries(["partial-invoices"])
      setConfirmOpen(false)
      setSelectedPayment(null)
      setConfirmMethod("cash")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => paymentApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["pending-payments"])
      queryClient.invalidateQueries(["payments-history"])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => paymentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["pending-payments"])
      queryClient.invalidateQueries(["unpaid-invoices"])
      queryClient.invalidateQueries(["partial-invoices"])
    },
  })

  function openPayDialog(invoice) {
    setSelectedInvoice(invoice)
    setConfirmImmediately(true)
    setForm({
      invoice_id: invoice.id.toString(),
      amount: (invoice.remaining_amount || invoice.total_amount)?.toString() || "",
      payment_method: "cash",
      bank_name: "", bank_account_number: "", reference_number: "",
      payment_date: new Date().toISOString().split("T")[0], notes: "",
    })
    setPayOpen(true)
  }

  const pendingItems = pendingPayments || []
  const historyItems = historyData?.data || []

  if (loadingUnpaid && loadingPending && loadingHistory) return <LoadingPage />

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Tagihan Belum Dibayar</h2>
          </div>
          {has("payment.create") && (
            <Button onClick={() => { setConfirmImmediately(false); setCreateOpen(true) }} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pembayaran
            </Button>
          )}
        </div>
        {loadingUnpaid ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : unpaidFiltered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Semua tagihan sudah dibayar.</p>
        ) : (
          <div className="rounded-md border">
            <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[180px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidFiltered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.tenant?.name || '-'}</TableCell>
                    <TableCell>{MONTHS[inv.period_month - 1]} {inv.period_year}</TableCell>
                    <TableCell>{formatCurrency(inv.total_amount)}</TableCell>
                    <TableCell><StatusBadge type="invoice" status={inv.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {has("payment.create") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                            onClick={() => {
                              setSelectedInvoice(inv)
                              setPendingNotes("")
                              setPendingOpen(true)
                            }}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Pending
                          </Button>
                        )}
                        {has("payment.create") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPayDialog(inv)}
                          >
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Bayar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Pembayaran Pending</h2>
          </div>
        {loadingPending ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : pendingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada pembayaran pending.</p>
        ) : (
          <div className="rounded-md border">
            <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pembayaran</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="w-[120px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.payment_number}</TableCell>
                    <TableCell>{item.invoice_number || '-'}</TableCell>
                    <TableCell>{item.tenant_name || '-'}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{PAYMENT_METHODS[item.payment_method] || item.payment_method}</TableCell>
                    <TableCell>{formatDate(item.payment_date)}</TableCell>
                    <TableCell>
                      {item.notes ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-blue-600 underline"
                          onClick={() => {
                            setSelectedNotes(item.notes)
                            setNotesOpen(true)
                          }}
                        >
                          Lihat Catatan
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {has("payment.confirm") && (
                          <Button variant="ghost" size="icon" title="Bayar" onClick={() => {
                            setSelectedPayment(item)
                            setConfirmMethod(item.payment_method || "cash")
                            setConfirmOpen(true)
                          }}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {has("payment.reject") && (
                          <Button variant="ghost" size="icon" title="Hapus" onClick={() => deleteMutation.mutate(item.id)}>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 mb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">Riwayat Pembayaran</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Cari no. pembayaran / invoice..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setHistoryPage(1) }}
              className="w-full sm:w-[250px]"
            />
            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setHistoryPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Semua Metode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Metode</SelectItem>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                <SelectItem value="ewallet">E-Wallet</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {loadingHistory ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : historyItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada riwayat pembayaran.</p>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {historyItems.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.payment_number}</span>
                  <StatusBadge type="payment" status={item.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="text-right">{item.invoice_number || '-'}</span>
                  <span className="text-muted-foreground">Tenant</span>
                  <span className="text-right">{item.tenant_name || '-'}</span>
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="text-right font-medium">{formatCurrency(item.amount)}</span>
                  <span className="text-muted-foreground">Metode</span>
                  <span className="text-right">{PAYMENT_METHODS[item.payment_method] || item.payment_method}</span>
                  <span className="text-muted-foreground">Tanggal</span>
                  <span className="text-right">{formatDate(item.payment_date)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden rounded-md border md:block">
            <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pembayaran</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.payment_number}</TableCell>
                    <TableCell>{item.invoice_number || '-'}</TableCell>
                    <TableCell>{item.tenant_name || '-'}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{PAYMENT_METHODS[item.payment_method] || item.payment_method}</TableCell>
                    <TableCell>{formatDate(item.payment_date)}</TableCell>
                    <TableCell><StatusBadge type="payment" status={item.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
          <PaginationNav page={historyPage} lastPage={historyData?.meta?.last_page} onPageChange={setHistoryPage} />
          </>
        )}
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bayar Tagihan</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoice_number} - {selectedInvoice?.tenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span>Total Tagihan</span>
                <span className="font-semibold">{formatCurrency(selectedInvoice?.total_amount)}</span>
              </div>
              {selectedInvoice?.remaining_amount != null && selectedInvoice.remaining_amount !== selectedInvoice.total_amount && (
                <div className="flex justify-between text-orange-600">
                  <span>Sisa Belum Dibayar</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoice?.remaining_amount)}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Bayar *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Metode *</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                    <SelectItem value="ewallet">E-Wallet</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.payment_method === 'bank_transfer' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>No. Rekening</Label>
                  <Input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Bayar *</Label>
                <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Ref. Number</Label>
                <Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Batal</Button>
            <LoadingButton loading={createMutation.isPending} onClick={() => createMutation.mutate(form)}>
              Simpan Pembayaran
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Pembayaran</DialogTitle>
            <DialogDescription>Record pembayaran dari tenant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice *</Label>
              <Select value={form.invoice_id} onValueChange={(v) => {
                const inv = allPendingInvoices.find(i => i.id.toString() === v)
                setForm({ ...form, invoice_id: v, amount: inv?.remaining_amount?.toString() || inv?.total_amount?.toString() || "" })
              }}>
                <SelectTrigger><SelectValue placeholder="Pilih invoice" /></SelectTrigger>
                <SelectContent>
                  {allPendingInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id.toString()}>
                      {inv.invoice_number} - {formatCurrency(inv.remaining_amount || inv.total_amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Metode *</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                    <SelectItem value="ewallet">E-Wallet</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.payment_method === 'bank_transfer' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>No. Rekening</Label>
                  <Input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Bayar *</Label>
                <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Ref. Number</Label>
                <Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <LoadingButton loading={createMutation.isPending} onClick={() => createMutation.mutate(form)}>
              Simpan
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Pembayaran Pending</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoice_number} - {selectedInvoice?.tenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span>Total Tagihan</span>
                <span className="font-semibold">{formatCurrency(selectedInvoice?.total_amount)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan *</Label>
              <Textarea
                placeholder="Masukkan catatan pembayaran..."
                value={pendingNotes}
                onChange={(e) => setPendingNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingOpen(false)}>Batal</Button>
            <LoadingButton
              loading={markPendingMutation.isPending}
              disabled={!pendingNotes.trim()}
              onClick={() => markPendingMutation.mutate({ invoice: selectedInvoice, notes: pendingNotes.trim() })}
            >
              Simpan Pending
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bayar Pembayaran</DialogTitle>
            <DialogDescription>
              {selectedPayment?.payment_number} - {selectedPayment?.tenant_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span>Jumlah</span>
                <span className="font-semibold">{formatCurrency(selectedPayment?.amount)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran *</Label>
              <Select value={confirmMethod} onValueChange={setConfirmMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <LoadingButton
              loading={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate({ id: selectedPayment?.id, payment_method: confirmMethod })}
            >
              Bayar
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catatan Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
            {selectedNotes}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
