import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cleaningApi } from "@/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { PaginationNav } from "@/components/shared/pagination-nav"
import { useDebounce } from "@/hooks/useDebounce"
import { TASK_STATUS, TASK_PRIORITY } from "@/lib/constants"
import { Play, CheckCircle, Clock, Building, Hash, PackageOpen, User } from "lucide-react"

const TYPE_LABELS = {
  cleaning: "Pembersihan",
  checkout: "Checkout",
  periodic: "Berkala",
  maintenance: "Maintenance",
  request: "Permintaan",
}

const TABS = [
  { key: "available", label: "Perlu Dikerjakan" },
  { key: "in_progress", label: "Dikerjakan" },
  { key: "waiting", label: "Menunggu Saya" },
  { key: "done", label: "Selesai" },
]

export default function StaffTasks() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("available")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  const isAvailableTab = activeTab === "available"

  const params = { page, per_page: 20 }
  if (isAvailableTab) {
    params.available = 1
  } else {
    params.mine = 1
    if (activeTab !== "all") params.status = activeTab
  }
  if (debouncedSearch) params.search = debouncedSearch

  const { data, isLoading } = useQuery({
    queryKey: ["staff-tasks", activeTab, debouncedSearch, page],
    queryFn: () => cleaningApi.list(params).then((res) => res.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => cleaningApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["staff-tasks"])
    },
    onError: (err) => {
      alert(err?.response?.data?.message || "Gagal mengubah status")
    },
  })

  if (isLoading) return <LoadingPage />

  const tasks = data?.data || []
  const meta = data?.meta || {}
  const counts = meta.status_counts || {}

  const getCount = (tab) => {
    if (tab === "available") return meta.available_count || 0
    if (tab === "in_progress") return counts.in_progress || 0
    if (tab === "waiting") return counts.waiting || 0
    if (tab === "done") return (counts.done || 0) + (counts.verified || 0)
    return meta.total || 0
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Task</h1>
        <p className="text-sm text-muted-foreground">
          {isAvailableTab
            ? "Tiket yang perlu dikerjakan — klik untuk mengambil"
            : activeTab === "in_progress"
            ? "Tiket yang sedang Anda kerjakan"
            : "Daftar tugas Anda"}
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => { setActiveTab(tab.key); setPage(1) }}
            className="whitespace-nowrap"
          >
            {tab.label}
            <Badge variant="secondary" className="ml-2 text-xs">
              {getCount(tab.key)}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Cari kamar, catatan..." />

      {/* Task Cards */}
      {tasks.length === 0 ? (
        <EmptyState
          title="Tidak ada tiket"
          description={
            isAvailableTab
              ? "Semua tiket sudah ditugaskan atau belum ada tiket baru"
              : "Tidak ada tugas dalam kategori ini"
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const isUnassigned = !task.assigned_to
            return (
              <Card
                key={task.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  isUnassigned && task.status === "waiting"
                    ? "ring-2 ring-blue-200 bg-blue-50/30"
                    : ""
                }`}
                onClick={() => navigate(`/staff/tasks/${task.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Kamar {task.room?.number || "-"}</span>
                    </div>
                    <Badge className={TASK_STATUS[task.status]?.color} variant="outline">
                      {TASK_STATUS[task.status]?.label}
                    </Badge>
                  </div>

                  {/* Property */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building className="h-3.5 w-3.5" />
                    {task.property?.name || "-"}
                  </div>

                  {/* Type + Priority */}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {TYPE_LABELS[task.type] || task.type}
                    </Badge>
                    {task.priority && task.priority !== "medium" && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          task.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : ""
                        }`}
                      >
                        {TASK_PRIORITY[task.priority]}
                      </Badge>
                    )}
                    {isUnassigned && task.status === "waiting" && (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                        Belum Ditugaskan
                      </Badge>
                    )}
                    {!isUnassigned && (
                      <Badge variant="outline" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        {task.assigned_to}
                      </Badge>
                    )}
                  </div>

                  {/* Notes preview */}
                  {task.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {task.notes}
                    </p>
                  )}

                  {/* Timestamps */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {task.created_at
                      ? new Date(task.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </div>

                  {/* Quick Action */}
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    {isUnassigned && task.status === "waiting" && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => statusMutation.mutate({ id: task.id, status: "in_progress" })}
                        disabled={statusMutation.isPending}
                      >
                        <PackageOpen className="h-3.5 w-3.5 mr-1" />
                        Ambil & Kerjakan
                      </Button>
                    )}
                    {!isUnassigned && task.status === "waiting" && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => statusMutation.mutate({ id: task.id, status: "in_progress" })}
                        disabled={statusMutation.isPending}
                      >
                        <Play className="h-3.5 w-3.5 mr-1" />
                        Mulai
                      </Button>
                    )}
                    {task.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="success"
                        className="w-full"
                        onClick={() => statusMutation.mutate({ id: task.id, status: "done" })}
                        disabled={statusMutation.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Selesai
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <PaginationNav page={page} lastPage={meta.last_page} onPageChange={setPage} />
    </div>
  )
}
