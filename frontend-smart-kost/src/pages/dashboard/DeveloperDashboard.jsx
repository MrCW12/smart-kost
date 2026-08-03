import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/api"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPage } from "@/components/shared/spinner"
import { Building2, DoorOpen, Users, DollarSign, TrendingUp, ClipboardList, Shield } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"

export default function DeveloperDashboard() {
  const navigate = useNavigate()
  const { data: ownerData, isLoading: ownerLoading } = useQuery({
    queryKey: ["dashboard", "owner"],
    queryFn: () => dashboardApi.owner().then((res) => res.data.data),
  })

  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => dashboardApi.admin().then((res) => res.data.data),
  })

  if (ownerLoading || adminLoading) return <LoadingPage />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Developer Dashboard</h2>
        <p className="text-muted-foreground">Overview seluruh sistem SmartKost</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Properti" value={ownerData?.summary?.total_properties || 0} icon={Building2} />
        <StatCard title="Total Kamar" value={ownerData?.summary?.total_rooms || 0} icon={DoorOpen} />
        <StatCard title="Occupancy Rate" value={`${ownerData?.summary?.occupancy_rate || 0}%`} icon={TrendingUp} />
        <StatCard title="Total Pendapatan" value={formatCurrency(ownerData?.revenue?.total_income || 0)} icon={DollarSign} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Profit Total" value={formatCurrency(ownerData?.revenue?.total_profit || 0)} icon={TrendingUp} />
        <StatCard title="Check-in Hari Ini" value={adminData?.today_checkins || 0} icon={Users} />
        <StatCard title="Check-out Hari Ini" value={adminData?.today_checkouts || 0} icon={Users} />
        <StatCard title="Pending Tasks" value={adminData?.pending_cleaning_tasks || 0} icon={ClipboardList} />
      </div>

      {/* Quick Access */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/developer/users")}>
              <Users className="mr-2 h-4 w-4" /> Kelola Users & Roles
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/developer/audit-logs")}>
              <Shield className="mr-2 h-4 w-4" /> View Audit Log
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pendapatan</span>
                <span className="font-medium">{formatCurrency(ownerData?.revenue?.current_month_income || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pengeluaran</span>
                <span className="font-medium">{formatCurrency(ownerData?.revenue?.current_month_expenses || 0)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Profit</span>
                  <span className="font-bold text-green-600">{formatCurrency(ownerData?.revenue?.current_month_profit || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kamar Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tersedia</span>
                <span className="font-medium">{ownerData?.summary?.available_rooms || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Terisi</span>
                <span className="font-medium">{ownerData?.summary?.occupied_rooms || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Today Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">{adminData?.today_checkins || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium">{adminData?.today_checkouts || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cleaning Tasks</span>
              <span className="font-medium">{adminData?.pending_cleaning_tasks || 0} pending</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
