import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { auditApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { PaginationNav } from "@/components/shared/pagination-nav"
import { useDebounce } from "@/hooks/useDebounce"
import { Eye, FileText } from "lucide-react"

const ACTION_LABELS = {
  create: "Buat",
  update: "Ubah",
  delete: "Hapus",
  "auth.login": "Login",
  "auth.logout": "Logout",
  "permission.sync": "Ubah Akses",
}

const ACTION_VARIANTS = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  "auth.login": "outline",
  "auth.logout": "outline",
  "permission.sync": "outline",
}

export default function AuditLogs() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState("all")
  const [modelFilter, setModelFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [detailLog, setDetailLog] = useState(null)
  const debouncedSearch = useDebounce(search, 300)

  const params = { page, per_page: 20 }
  if (debouncedSearch) params.q = debouncedSearch
  if (actionFilter !== "all") params.action = actionFilter
  if (modelFilter !== "all") params.model = modelFilter
  if (userFilter !== "all") params.user_id = userFilter

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", debouncedSearch, page, actionFilter, modelFilter, userFilter],
    queryFn: () => auditApi.list(params).then((res) => res.data),
  })

  if (isLoading) return <LoadingPage />

  const logs = data?.data || []
  const meta = data?.meta || {}
  const filters = meta.filters || { actions: [], models: [], users: [] }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Cari aksi, IP, user..." />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Aksi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              {filters.actions.map((a) => (
                <SelectItem key={a} value={a}>{ACTION_LABELS[a] || a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={modelFilter} onValueChange={(v) => { setModelFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Model" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Model</SelectItem>
              {filters.models.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua User" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua User</SelectItem>
              {filters.users.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px]">Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState title="Tidak ada audit log" />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("id-ID", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">{log.user || "System"}</TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANTS[log.action] || "secondary"}>
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.model_type || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.model_id || "-"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip_address || "-"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDetailLog(log)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <PaginationNav page={page} lastPage={meta.last_page} onPageChange={setPage} />

      <Dialog open={!!detailLog} onOpenChange={() => setDetailLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Audit Log</DialogTitle>
            <DialogDescription>
              {detailLog && (
                <span>
                  {ACTION_LABELS[detailLog.action] || detailLog.action} — {detailLog.model_type} #{detailLog.model_id || "-"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {detailLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-muted-foreground">User</span>
                  <p>{detailLog.user || "System"}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Waktu</span>
                  <p>{new Date(detailLog.created_at).toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">IP</span>
                  <p className="font-mono">{detailLog.ip_address || "-"}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Model</span>
                  <p>{detailLog.model_type} #{detailLog.model_id || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Nilai Lama
                  </span>
                  <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(detailLog.old_values, null, 2) || "-"}
                  </pre>
                </div>
                <div className="space-y-2">
                  <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Nilai Baru
                  </span>
                  <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(detailLog.new_values, null, 2) || "-"}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
