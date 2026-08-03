import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { tenantApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { StatusBadge } from "@/components/shared/status-badge"
import { PaginationNav } from "@/components/shared/pagination-nav"
import { useDebounce } from "@/hooks/useDebounce"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Users } from "lucide-react"

export default function Occupants() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = useQuery({
    queryKey: ["occupants", debouncedSearch, page, statusFilter],
    queryFn: () => {
      const params = { search: debouncedSearch, page, per_page: 15 }
      if (statusFilter) params.status = statusFilter
      return tenantApi.list(params).then((res) => res.data)
    },
  })

  if (isLoading) return <LoadingPage />
  const items = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Penghuni</h2>
          <p className="text-sm text-muted-foreground">Daftar tenant dan informasi sewanya</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari penghuni..." />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="checked_out">Sudah Checkout</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Tenant</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Tanggal Masuk</TableHead>
                <TableHead>Kamar</TableHead>
                <TableHead>Lantai</TableHead>
                <TableHead>Properti</TableHead>
                <TableHead>Tipe Kamar</TableHead>
                <TableHead>Harga Sewa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState title="Tidak ada penghuni" icon={Users} />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.nik || '-'}</TableCell>
                    <TableCell>{formatDate(item.active_contract?.start_date)}</TableCell>
                    <TableCell>{item.active_contract?.room_number || '-'}</TableCell>
                    <TableCell>{item.active_contract?.room_floor != null ? `Lt. ${item.active_contract.room_floor}` : '-'}</TableCell>
                    <TableCell>{item.active_contract?.property_name || '-'}</TableCell>
                    <TableCell>{item.active_contract?.room_type || '-'}</TableCell>
                    <TableCell>{formatCurrency(item.active_contract?.monthly_price || 0)}</TableCell>
                    <TableCell><StatusBadge type="tenant" status={item.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <PaginationNav page={page} lastPage={data?.meta?.last_page} onPageChange={setPage} />
    </div>
  )
}
