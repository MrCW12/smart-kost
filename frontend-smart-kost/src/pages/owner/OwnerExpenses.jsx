import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { expenseApi, propertyApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/shared/loading-button"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { useDebounce } from "@/hooks/useDebounce"
import { usePermission } from "@/hooks/usePermission"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Pencil, Trash2, Plus, ClipboardList } from "lucide-react"
import { PAYMENT_METHODS } from "@/lib/constants"
import { PaginationNav } from "@/components/shared/pagination-nav"

export default function OwnerExpenses() {
  const { has } = usePermission()
  const [page, setPage] = useState(1)
  const [propertyFilter, setPropertyFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    property_id: "", expense_category_id: "", title: "", description: "",
    amount: "", expense_date: new Date().toISOString().split("T")[0], payment_method: "cash", receipt: "",
  })
  const queryClient = useQueryClient()

  const { data: properties } = useQuery({
    queryKey: ["properties-list"],
    queryFn: () => propertyApi.list({ per_page: 100 }).then((res) => res.data.data),
  })

  const { data: categories } = useQuery({
    queryKey: ["expense-categories", form.property_id],
    queryFn: () => form.property_id ? expenseApi.getCategories(form.property_id).then((res) => res.data.data) : [],
    enabled: !!form.property_id,
  })

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", page, propertyFilter],
    queryFn: () => {
      const params = { page, per_page: 15 }
      if (propertyFilter) params.property_id = propertyFilter
      return expenseApi.list(params).then((res) => res.data)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"])
      setDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => expenseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"])
      setDialogOpen(false)
      setSelected(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"])
      setDeleteDialogOpen(false)
      setSelected(null)
    },
  })

  const resetForm = () => setForm({
    property_id: "", expense_category_id: "", title: "", description: "",
    amount: "", expense_date: new Date().toISOString().split("T")[0], payment_method: "cash", receipt: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, amount: Number(form.amount) }
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      property_id: item.property_id?.toString() || "",
      expense_category_id: item.expense_category_id?.toString() || "",
      title: item.title || "", description: item.description || "",
      amount: item.amount?.toString() || "",
      expense_date: item.expense_date || "",
      payment_method: item.payment_method || "cash",
      receipt: item.receipt || "",
    })
    setDialogOpen(true)
  }

  if (isLoading) return <LoadingPage />
  const items = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Semua Properti" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Properti</SelectItem>
              {(properties || []).map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {has("expense.create") && (
          <Button onClick={() => { resetForm(); setSelected(null); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pengeluaran
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Dibuat Oleh</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState title="Tidak ada pengeluaran" icon={ClipboardList} />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                  <TableCell>{formatDate(item.expense_date)}</TableCell>
                  <TableCell>{PAYMENT_METHODS[item.payment_method] || item.payment_method}</TableCell>
                  <TableCell>{item.created_by || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {has("expense.update") && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {has("expense.delete") && (
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
            <DialogTitle>{selected ? "Edit Pengeluaran" : "Tambah Pengeluaran"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Properti *</Label>
              <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v, expense_category_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                <SelectContent>
                  {(properties || []).map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={form.expense_category_id} onValueChange={(v) => setForm({ ...form, expense_category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {(categories || []).map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Tanggal *</Label>
                <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Metode Bayar *</Label>
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
            <DialogTitle>Hapus Pengeluaran</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus pengeluaran <strong>{selected?.title}</strong>?</DialogDescription>
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
