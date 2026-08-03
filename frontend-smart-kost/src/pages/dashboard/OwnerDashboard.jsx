import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/api"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPage } from "@/components/shared/spinner"
import { Building2, DoorOpen, DollarSign, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { EmptyState } from "@/components/shared/empty-state"

export default function OwnerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "owner"],
    queryFn: () => dashboardApi.owner().then((res) => res.data.data),
  })

  if (isLoading) return <LoadingPage />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Owner</h2>
        <p className="text-muted-foreground">Ringkasan properti dan keuangan Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properti"
          value={data?.summary?.total_properties || 0}
          icon={Building2}
        />
        <StatCard
          title="Total Kamar"
          value={data?.summary?.total_rooms || 0}
          icon={DoorOpen}
        />
        <StatCard
          title="Total Pendapatan"
          value={formatCurrency(data?.revenue?.total_income || 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(data?.revenue?.total_profit || 0)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pendapatan</span>
                <span className="font-medium">{formatCurrency(data?.revenue?.current_month_income || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pengeluaran</span>
                <span className="font-medium">{formatCurrency(data?.revenue?.current_month_expenses || 0)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Profit</span>
                  <span className="font-bold text-green-600">{formatCurrency(data?.revenue?.current_month_profit || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Kamar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tersedia</span>
                <span className="font-medium">{data?.summary?.available_rooms || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Terisi</span>
                <span className="font-medium">{data?.summary?.occupied_rooms || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                <span className="font-medium">{data?.summary?.occupancy_rate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
