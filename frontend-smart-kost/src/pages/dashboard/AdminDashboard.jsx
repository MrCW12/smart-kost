import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/api"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPage } from "@/components/shared/spinner"
import { DoorOpen, ClipboardList, Users, ArrowRight } from "lucide-react"

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => dashboardApi.admin().then((res) => res.data.data),
  })

  if (isLoading) return <LoadingPage />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Admin</h2>
        <p className="text-muted-foreground">Overview aktivitas hari ini</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Check-in Hari Ini" value={data?.today_checkins || 0} icon={ArrowRight} />
        <StatCard title="Check-out Hari Ini" value={data?.today_checkouts || 0} icon={ArrowRight} />
        <StatCard title="Pending Tasks" value={data?.pending_cleaning_tasks || 0} icon={ClipboardList} />
        <StatCard title="Rooms Available" value={data?.available_rooms || 0} icon={DoorOpen} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recent_tenants?.length > 0 ? (
              <div className="space-y-3">
                {data.recent_tenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{tenant.room?.number}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada tenant baru</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.upcoming_tasks?.length > 0 ? (
              <div className="space-y-3">
                {data.upcoming_tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{task.room?.number}</p>
                      <p className="text-xs text-muted-foreground">{task.task_type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{task.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada upcoming tasks</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
