import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import AppLayout from "@/components/layout/AppLayout"
import LoginPage from "@/pages/auth/LoginPage"
import DeveloperDashboard from "@/pages/dashboard/DeveloperDashboard"
import OwnerDashboard from "@/pages/dashboard/OwnerDashboard"
import StaffDashboard from "@/pages/dashboard/StaffDashboard"
import UserManagement from "@/pages/developer/UserManagement"
import AuditLogs from "@/pages/developer/AuditLogs"
import ComingSoon from "@/pages/shared/ComingSoon"
import ProtectedRoute from "@/routes/ProtectedRoute"
import RootRedirect from "@/routes/RootRedirect"
import RequirePerm from "@/routes/RequirePerm"

import OwnerProperties from "@/pages/owner/OwnerProperties"
import OwnerRooms from "@/pages/owner/OwnerRooms"
import OwnerRoomTypes from "@/pages/owner/OwnerRoomTypes"
import OwnerTenants from "@/pages/owner/OwnerTenants"
import OwnerInvoices from "@/pages/owner/OwnerInvoices"
import OwnerPayments from "@/pages/owner/OwnerPayments"
import OwnerExpenses from "@/pages/owner/OwnerExpenses"
import OwnerReports from "@/pages/owner/OwnerReports"
import OwnerUtilitySettings from "@/pages/owner/OwnerUtilitySettings"
import OwnerTasks from "@/pages/owner/OwnerTasks"
import StaffTaskDetail from "@/pages/staff/StaffTaskDetail"
import StaffTasks from "@/pages/staff/StaffTasks"
import Occupants from "@/pages/shared/Occupants"
import Settings from "@/pages/shared/Settings"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Developer System Routes */}
          <Route element={<ProtectedRoute roles={["developer"]}><AppLayout /></ProtectedRoute>}>
            <Route path="/developer" element={<DeveloperDashboard />} />
            <Route path="/developer/users" element={<RequirePerm permission="user.view"><UserManagement /></RequirePerm>} />
            <Route path="/developer/audit-logs" element={<RequirePerm permission="system.audit-log"><AuditLogs /></RequirePerm>} />
            <Route path="/developer/tasks" element={<RequirePerm permission="cleaning.view"><OwnerTasks /></RequirePerm>} />
            <Route path="/profile" element={<Settings />} />
          </Route>

          {/* Owner Routes (developer + owner) */}
          <Route element={<ProtectedRoute roles={["developer", "owner"]}><AppLayout /></ProtectedRoute>}>
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/owner/properties" element={<RequirePerm permission="property.view"><OwnerProperties /></RequirePerm>} />
            <Route path="/owner/rooms" element={<RequirePerm permission="room.view"><OwnerRooms /></RequirePerm>} />
            <Route path="/owner/room-types" element={<RequirePerm permission="room-type.view"><OwnerRoomTypes /></RequirePerm>} />
            <Route path="/owner/tenants" element={<RequirePerm permission="tenant.view"><OwnerTenants /></RequirePerm>} />
            <Route path="/owner/contracts" element={<RequirePerm permission="contract.view"><ComingSoon title="Kontrak" /></RequirePerm>} />
            <Route path="/owner/invoices" element={<RequirePerm permission="invoice.view"><OwnerInvoices /></RequirePerm>} />
            <Route path="/owner/payments" element={<RequirePerm permission="payment.view"><OwnerPayments /></RequirePerm>} />
            <Route path="/owner/expenses" element={<RequirePerm permission="expense.view"><OwnerExpenses /></RequirePerm>} />
            <Route path="/owner/reports" element={<RequirePerm permission="report.finance"><OwnerReports /></RequirePerm>} />
            <Route path="/owner/utility-settings" element={<RequirePerm permission="utility.setting"><OwnerUtilitySettings /></RequirePerm>} />
            <Route path="/owner/tasks" element={<RequirePerm permission="cleaning.view"><OwnerTasks /></RequirePerm>} />
            <Route path="/owner/penghuni" element={<RequirePerm permission="tenant.view"><Occupants /></RequirePerm>} />
            <Route path="/profile" element={<Settings />} />
          </Route>

          {/* Admin Routes (developer + admin) */}
          <Route element={<ProtectedRoute roles={["developer", "admin"]}><AppLayout /></ProtectedRoute>}>
            <Route path="/admin" element={<OwnerDashboard />} />
            <Route path="/admin/properties" element={<RequirePerm permission="property.view"><OwnerProperties /></RequirePerm>} />
            <Route path="/admin/rooms" element={<RequirePerm permission="room.view"><OwnerRooms /></RequirePerm>} />
            <Route path="/admin/room-types" element={<RequirePerm permission="room-type.view"><OwnerRoomTypes /></RequirePerm>} />
            <Route path="/admin/tenants" element={<RequirePerm permission="tenant.view"><OwnerTenants /></RequirePerm>} />
            <Route path="/admin/contracts" element={<RequirePerm permission="contract.view"><ComingSoon title="Kontrak" /></RequirePerm>} />
            <Route path="/admin/invoices" element={<RequirePerm permission="invoice.view"><OwnerInvoices /></RequirePerm>} />
            <Route path="/admin/payments" element={<RequirePerm permission="payment.view"><OwnerPayments /></RequirePerm>} />
            <Route path="/admin/expenses" element={<RequirePerm permission="expense.view"><OwnerExpenses /></RequirePerm>} />
            <Route path="/admin/reports" element={<RequirePerm permission="report.finance"><OwnerReports /></RequirePerm>} />
            <Route path="/admin/utility-settings" element={<RequirePerm permission="utility.setting"><OwnerUtilitySettings /></RequirePerm>} />
            <Route path="/admin/tasks" element={<RequirePerm permission="cleaning.view"><OwnerTasks /></RequirePerm>} />
            <Route path="/admin/penghuni" element={<RequirePerm permission="tenant.view"><Occupants /></RequirePerm>} />
            <Route path="/profile" element={<Settings />} />
          </Route>

          {/* Staff Routes (developer + staff) */}
          <Route element={<ProtectedRoute roles={["developer", "staff"]}><AppLayout /></ProtectedRoute>}>
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/staff/properties" element={<RequirePerm permission="property.view"><OwnerProperties /></RequirePerm>} />
            <Route path="/staff/rooms" element={<RequirePerm permission="room.view"><OwnerRooms /></RequirePerm>} />
            <Route path="/staff/room-types" element={<RequirePerm permission="room-type.view"><OwnerRoomTypes /></RequirePerm>} />
            <Route path="/staff/tenants" element={<RequirePerm permission="tenant.view"><OwnerTenants /></RequirePerm>} />
            <Route path="/staff/contracts" element={<RequirePerm permission="contract.view"><ComingSoon title="Kontrak" /></RequirePerm>} />
            <Route path="/staff/invoices" element={<RequirePerm permission="invoice.view"><OwnerInvoices /></RequirePerm>} />
            <Route path="/staff/payments" element={<RequirePerm permission="payment.view"><OwnerPayments /></RequirePerm>} />
            <Route path="/staff/expenses" element={<RequirePerm permission="expense.view"><OwnerExpenses /></RequirePerm>} />
            <Route path="/staff/reports" element={<RequirePerm permission="report.finance"><OwnerReports /></RequirePerm>} />
            <Route path="/staff/utility-settings" element={<RequirePerm permission="utility.setting"><OwnerUtilitySettings /></RequirePerm>} />
            <Route path="/staff/tasks" element={<RequirePerm permission="cleaning.view"><StaffTasks /></RequirePerm>} />
            <Route path="/staff/tasks/:id" element={<RequirePerm permission="cleaning.view"><StaffTaskDetail /></RequirePerm>} />
            <Route path="/staff/penghuni" element={<RequirePerm permission="tenant.view"><Occupants /></RequirePerm>} />
            <Route path="/profile" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
