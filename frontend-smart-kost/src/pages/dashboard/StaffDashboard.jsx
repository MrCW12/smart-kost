import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/api"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPage } from "@/components/shared/spinner"
import { ClipboardList, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"

export default function StaffDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "staff"],
    queryFn: () => dashboardApi.staff().then((res) => res.data.data),
  })

  if (isLoading) return <LoadingPage />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Staff</h2>
        <p className="text-muted-foreground">Tugas pembersihan hari ini</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tasks" value={data?.stats?.total_tasks || 0} icon={ClipboardList} />
        <StatCard title="Selesai" value={data?.stats?.completed_tasks || 0} icon={CheckCircle} />
        <StatCard title="In Progress" value={data?.stats?.in_progress_tasks || 0} icon={Clock} />
        <StatCard title="Pending" value={data?.stats?.pending_tasks || 0} icon={AlertCircle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.my_tasks?.length > 0 ? (
            <div className="space-y-3">
              {data.my_tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Room {task.room?.number}</p>
                    <p className="text-sm text-muted-foreground">{task.task_type} - {task.notes}</p>
                  </div>
                  <StatusBadge type="task" status={task.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada tugas aktif</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
