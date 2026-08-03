import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { reportApi, propertyApi } from "@/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LoadingPage } from "@/components/shared/spinner"
import { StatCard } from "@/components/shared/stat-card"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, Building2, Users, TrendingUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationNav } from "@/components/shared/pagination-nav"

const PAGE_SIZE = 15

export default function OwnerReports() {
  const [activeTab, setActiveTab] = useState("finance")
  const [propertyFilter, setPropertyFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [financePage, setFinancePage] = useState(1)
  const [occupancyPage, setOccupancyPage] = useState(1)
  const [tenantCheckinPage, setTenantCheckinPage] = useState(1)

  const { data: properties } = useQuery({
    queryKey: ["properties-list"],
    queryFn: () => propertyApi.list({ per_page: 100 }).then((res) => res.data.data),
  })

  const financeParams = { property_id: propertyFilter || undefined, start_date: startDate || undefined, end_date: endDate || undefined }

  const { data: financeData, isLoading: financeLoading } = useQuery({
    queryKey: ["report-finance", financeParams],
    queryFn: () => reportApi.finance(financeParams).then((res) => res.data.data),
    enabled: activeTab === "finance",
  })

  const { data: occupancyData, isLoading: occupancyLoading } = useQuery({
    queryKey: ["report-occupancy", { property_id: propertyFilter }],
    queryFn: () => reportApi.occupancy({ property_id: propertyFilter || undefined }).then((res) => res.data.data),
    enabled: activeTab === "occupancy",
  })

  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ["report-tenant", { property_id: propertyFilter }],
    queryFn: () => reportApi.tenant({ property_id: propertyFilter || undefined }).then((res) => res.data.data),
    enabled: activeTab === "tenant",
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Laporan</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Properti</Label>
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
            <div className="space-y-2">
              <Label>Dari Tanggal</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sampai Tanggal</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="finance">Keuangan</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="tenant">Tenant</TabsTrigger>
        </TabsList>

        {/* Finance Report */}
        <TabsContent value="finance" className="space-y-4">
          {financeLoading ? <LoadingPage /> : financeData ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Pendapatan" value={formatCurrency(financeData.summary?.total_revenue || 0)} icon={DollarSign} />
                <StatCard title="Total Pengeluaran" value={formatCurrency(financeData.summary?.total_expenses || 0)} icon={TrendingUp} />
                <StatCard title="Profit" value={formatCurrency(financeData.summary?.profit || 0)} icon={TrendingUp} />
              </div>
              {financeData.monthly_breakdown?.length > 0 && (() => {
                const allRows = financeData.monthly_breakdown
                const financeLastPage = Math.ceil(allRows.length / PAGE_SIZE)
                const financeRows = allRows.slice((financePage - 1) * PAGE_SIZE, financePage * PAGE_SIZE)
                return (
                <Card>
                  <CardHeader><CardTitle>Breakdown Bulanan</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Periode</TableHead>
                          <TableHead>Pendapatan</TableHead>
                          <TableHead>Pengeluaran</TableHead>
                          <TableHead>Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financeRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{row.month}/{row.year}</TableCell>
                            <TableCell>{formatCurrency(row.revenue)}</TableCell>
                            <TableCell>{formatCurrency(row.expense)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(row.profit)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                    <PaginationNav page={financePage} lastPage={financeLastPage} onPageChange={setFinancePage} />
                  </CardContent>
                </Card>
                )
              })()}
            </>
          ) : null}
        </TabsContent>

        {/* Occupancy Report */}
        <TabsContent value="occupancy" className="space-y-4">
          {occupancyLoading ? <LoadingPage /> : occupancyData ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="Total Kamar" value={occupancyData.summary?.total_rooms || 0} icon={Building2} />
                <StatCard title="Terisi" value={occupancyData.summary?.occupied || 0} icon={Building2} />
                <StatCard title="Tersedia" value={occupancyData.summary?.available || 0} icon={Building2} />
                <StatCard title="Occupancy Rate" value={`${occupancyData.summary?.occupancy_rate || 0}%`} icon={TrendingUp} />
              </div>
              {occupancyData.by_property?.length > 0 && (() => {
                const allRows = occupancyData.by_property
                const occLastPage = Math.ceil(allRows.length / PAGE_SIZE)
                const occRows = allRows.slice((occupancyPage - 1) * PAGE_SIZE, occupancyPage * PAGE_SIZE)
                return (
                <Card>
                  <CardHeader><CardTitle>Per Properti</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Properti</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Terisi</TableHead>
                          <TableHead>Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {occRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>{row.total_rooms}</TableCell>
                            <TableCell>{row.occupied_rooms}</TableCell>
                            <TableCell>{row.occupancy_rate}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                    <PaginationNav page={occupancyPage} lastPage={occLastPage} onPageChange={setOccupancyPage} />
                  </CardContent>
                </Card>
                )
              })()}
            </>
          ) : null}
        </TabsContent>

        {/* Tenant Report */}
        <TabsContent value="tenant" className="space-y-4">
          {tenantLoading ? <LoadingPage /> : tenantData ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Tenant" value={tenantData.summary?.total_tenants || 0} icon={Users} />
                <StatCard title="Active" value={tenantData.summary?.active_tenants || 0} icon={Users} />
                <StatCard title="Baru Bulan Ini" value={tenantData.summary?.new_this_month || 0} icon={Users} />
              </div>
              {tenantData.recent_tenants?.length > 0 && (() => {
                const allRows = tenantData.recent_tenants
                const tcLastPage = Math.ceil(allRows.length / PAGE_SIZE)
                const tcRows = allRows.slice((tenantCheckinPage - 1) * PAGE_SIZE, tenantCheckinPage * PAGE_SIZE)
                return (
                <Card>
                  <CardHeader><CardTitle>Tenant Terbaru</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>No. HP</TableHead>
                          <TableHead>Kamar</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tcRows.map((t, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{t.name}</TableCell>
                            <TableCell>{t.phone || '-'}</TableCell>
                            <TableCell>{t.room_number || '-'}</TableCell>
                            <TableCell>{t.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                    <PaginationNav page={tenantCheckinPage} lastPage={tcLastPage} onPageChange={setTenantCheckinPage} />
                  </CardContent>
                </Card>
                )
              })()}
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
