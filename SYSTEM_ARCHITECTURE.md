# SMARTKOST MANAGEMENT - SYSTEM ARCHITECTURE

## PROJECT STRUCTURE

### Backend (Laravel 12 API)

```
bacend-smart-kost/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       ├── GenerateInvoicesCommand.php
│   │       └── SendReminderCommand.php
│   │
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── AuthController.php
│   │   │   │   │   └── ProfileController.php
│   │   │   │   ├── Developer/
│   │   │   │   │   ├── UserController.php
│   │   │   │   │   ├── RoleController.php
│   │   │   │   │   ├── AuditLogController.php
│   │   │   │   │   └── SwitchOwnerController.php
│   │   │   │   ├── Owner/
│   │   │   │   │   ├── OwnerProfileController.php
│   │   │   │   │   ├── PropertyController.php
│   │   │   │   │   ├── RoomTypeController.php
│   │   │   │   │   ├── RoomController.php
│   │   │   │   │   ├── TenantController.php
│   │   │   │   │   ├── ContractController.php
│   │   │   │   │   ├── InvoiceController.php
│   │   │   │   │   ├── PaymentController.php
│   │   │   │   │   ├── ExpenseController.php
│   │   │   │   │   └── ReportController.php
│   │   │   │   ├── Admin/
│   │   │   │   │   ├── TenantController.php
│   │   │   │   │   ├── RoomController.php
│   │   │   │   │   ├── UtilityReadingController.php
│   │   │   │   │   ├── InvoiceController.php
│   │   │   │   │   ├── PaymentController.php
│   │   │   │   │   └── ExpenseController.php
│   │   │   │   ├── Staff/
│   │   │   │   │   ├── UtilityReadingController.php
│   │   │   │   │   └── CleaningTaskController.php
│   │   │   │   └── Dashboard/
│   │   │   │       ├── OwnerDashboardController.php
│   │   │   │       ├── AdminDashboardController.php
│   │   │   │       └── StaffDashboardController.php
│   │   │   └── Controller.php (base)
│   │   │
│   │   ├── Middleware/
│   │   │   ├── EnsureUserIsActive.php
│   │   │   ├── OwnerScope.php
│   │   │   └── PropertyScope.php
│   │   │
│   │   ├── Requests/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginRequest.php
│   │   │   │   └── RegisterRequest.php
│   │   │   ├── Owner/
│   │   │   │   ├── StorePropertyRequest.php
│   │   │   │   ├── UpdatePropertyRequest.php
│   │   │   │   ├── StoreRoomRequest.php
│   │   │   │   ├── StoreTenantRequest.php
│   │   │   │   └── ...
│   │   │   └── ...
│   │   │
│   │   └── Resources/
│   │       ├── UserResource.php
│   │       ├── OwnerResource.php
│   │       ├── PropertyResource.php
│   │       ├── RoomResource.php
│   │       ├── TenantResource.php
│   │       ├── ContractResource.php
│   │       ├── InvoiceResource.php
│   │       ├── InvoiceItemResource.php
│   │       ├── PaymentResource.php
│   │       ├── ExpenseResource.php
│   │       ├── UtilityReadingResource.php
│   │       ├── CleaningTaskResource.php
│   │       └── ...
│   │
│   ├── Models/
│   │   ├── User.php
│   │   ├── Owner.php
│   │   ├── Property.php
│   │   ├── RoomType.php
│   │   ├── Room.php
│   │   ├── Tenant.php
│   │   ├── Contract.php
│   │   ├── Invoice.php
│   │   ├── InvoiceItem.php
│   │   ├── Payment.php
│   │   ├── Expense.php
│   │   ├── ExpenseCategory.php
│   │   ├── UtilitySetting.php
│   │   ├── UtilityReading.php
│   │   ├── CleaningTask.php
│   │   ├── CleaningTaskPhoto.php
│   │   ├── PropertyUser.php
│   │   └── AuditLog.php
│   │
│   ├── Policies/
│   │   ├── PropertyPolicy.php
│   │   ├── RoomTypePolicy.php
│   │   ├── RoomPolicy.php
│   │   ├── TenantPolicy.php
│   │   ├── ContractPolicy.php
│   │   ├── InvoicePolicy.php
│   │   ├── PaymentPolicy.php
│   │   ├── ExpensePolicy.php
│   │   ├── UtilityReadingPolicy.php
│   │   └── CleaningTaskPolicy.php
│   │
│   ├── Services/
│   │   ├── Auth/
│   │   │   └── AuthService.php
│   │   ├── Owner/
│   │   │   ├── OwnerService.php
│   │   │   └── PropertyService.php
│   │   ├── Room/
│   │   │   ├── RoomTypeService.php
│   │   │   └── RoomService.php
│   │   ├── Tenant/
│   │   │   └── TenantService.php
│   │   ├── Contract/
│   │   │   └── ContractService.php
│   │   ├── Billing/
│   │   │   ├── InvoiceService.php
│   │   │   ├── InvoiceNumberGenerator.php
│   │   │   └── UtilityCalculationService.php
│   │   ├── Payment/
│   │   │   └── PaymentService.php
│   │   ├── Expense/
│   │   │   └── ExpenseService.php
│   │   ├── Cleaning/
│   │   │   └── CleaningTaskService.php
│   │   ├── Dashboard/
│   │   │   ├── OwnerDashboardService.php
│   │   │   ├── AdminDashboardService.php
│   │   │   └── StaffDashboardService.php
│   │   └── Report/
│   │       └── ReportService.php
│   │
│   ├── Enums/
│   │   ├── RoomStatus.php
│   │   ├── TenantStatus.php
│   │   ├── ContractStatus.php
│   │   ├── InvoiceStatus.php
│   │   ├── PaymentMethod.php
│   │   ├── PaymentStatus.php
│   │   ├── UtilityType.php
│   │   ├── CleaningTaskStatus.php
│   │   └── CleaningTaskType.php
│   │
│   ├── Exceptions/
│   │   ├── ForbiddenException.php
│   │   └── NotFoundException.php
│   │
│   └── Traits/
│       ├── HasOwner.php
│       ├── HasProperty.php
│       └── ApiResponse.php
│
├── config/
│   ├── sanctum.php
│   └── permission.php (Spatie)
│
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 2026_07_21_000001_create_personal_access_tokens_table.php
│   │   ├── 2026_07_21_000002_create_permission_tables.php
│   │   ├── 2026_07_21_000003_create_owners_table.php
│   │   ├── 2026_07_21_000004_create_properties_table.php
│   │   ├── 2026_07_21_000005_create_property_user_table.php
│   │   ├── 2026_07_21_000006_create_room_types_table.php
│   │   ├── 2026_07_21_000007_create_rooms_table.php
│   │   ├── 2026_07_21_000008_create_tenants_table.php
│   │   ├── 2026_07_21_000009_create_contracts_table.php
│   │   ├── 2026_07_21_000010_create_utility_settings_table.php
│   │   ├── 2026_07_21_000011_create_utility_readings_table.php
│   │   ├── 2026_07_21_000012_create_invoices_table.php
│   │   ├── 2026_07_21_000013_create_invoice_items_table.php
│   │   ├── 2026_07_21_000014_create_payments_table.php
│   │   ├── 2026_07_21_000015_create_expense_categories_table.php
│   │   ├── 2026_07_21_000016_create_expenses_table.php
│   │   ├── 2026_07_21_000017_create_cleaning_tasks_table.php
│   │   ├── 2026_07_21_000018_create_cleaning_task_photos_table.php
│   │   └── 2026_07_21_000019_create_audit_logs_table.php
│   │
│   ├── seeders/
│   │   ├── DatabaseSeeder.php
│   │   ├── RoleSeeder.php
│   │   ├── PermissionSeeder.php
│   │   ├── RoleHasPermissionSeeder.php
│   │   ├── UserSeeder.php
│   │   ├── OwnerSeeder.php
│   │   ├── PropertySeeder.php
│   │   ├── RoomTypeSeeder.php
│   │   ├── RoomSeeder.php
│   │   ├── TenantSeeder.php
│   │   ├── ContractSeeder.php
│   │   ├── UtilitySettingSeeder.php
│   │   └── ExpenseCategorySeeder.php
│   │
│   └── factories/
│       ├── OwnerFactory.php
│       ├── PropertyFactory.php
│       ├── RoomFactory.php
│       ├── TenantFactory.php
│       ├── ContractFactory.php
│       ├── InvoiceFactory.php
│       └── ...
│
├── routes/
│   ├── api.php
│   └── console.php
│
└── tests/
    └── Feature/
        ├── Auth/
        ├── Owner/
        ├── Admin/
        └── Staff/
```

---

### Frontend (React 19 + Vite)

```
frontend-smart-kost/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   │
│   ├── api/
│   │   ├── axios.js              (Axios instance config)
│   │   ├── auth.js               (Login, Register, Me)
│   │   ├── owner.js              (Owner CRUD)
│   │   ├── property.js           (Property CRUD)
│   │   ├── roomType.js           (Room Type CRUD)
│   │   ├── room.js               (Room CRUD)
│   │   ├── tenant.js             (Tenant CRUD)
│   │   ├── contract.js           (Contract CRUD)
│   │   ├── invoice.js            (Invoice CRUD)
│   │   ├── payment.js            (Payment CRUD)
│   │   ├── expense.js            (Expense CRUD)
│   │   ├── utility.js            (Utility CRUD)
│   │   ├── cleaning.js           (Cleaning Task CRUD)
│   │   ├── dashboard.js          (Dashboard data)
│   │   └── report.js             (Report data)
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── usePermission.js
│   │   └── useDebounce.js
│   │
│   ├── stores/
│   │   ├── authStore.js          (Zustand auth state)
│   │   └── uiStore.js            (Sidebar, theme)
│   │
│   ├── lib/
│   │   ├── utils.js              (cn, formatCurrency, formatDate)
│   │   ├── constants.js          (Status labels, colors)
│   │   └── validators.js         (Zod schemas)
│   │
│   ├── components/
│   │   ├── ui/                   (shadcn/ui components)
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── select.jsx
│   │   │   ├── table.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── card.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── toast.jsx
│   │   │   ├── form.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── pagination.jsx
│   │   │   ├── skeleton.jsx
│   │   │   └── separator.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx     (Sidebar + Navbar + Content)
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Breadcrumb.jsx
│   │   │
│   │   ├── data-table/
│   │   │   ├── DataTable.jsx     (TanStack Table wrapper)
│   │   │   ├── DataTablePagination.jsx
│   │   │   ├── DataTableSearch.jsx
│   │   │   ├── DataTableFilter.jsx
│   │   │   └── DataTableColumnHeader.jsx
│   │   │
│   │   ├── forms/
│   │   │   ├── PropertyForm.jsx
│   │   │   ├── RoomForm.jsx
│   │   │   ├── TenantForm.jsx
│   │   │   ├── InvoiceForm.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   └── ExpenseForm.jsx
│   │   │
│   │   └── shared/
│   │       ├── DeleteDialog.jsx
│   │       ├── StatusBadge.jsx
│   │       ├── EmptyState.jsx
│   │       ├── LoadingSpinner.jsx
│   │       ├── SearchInput.jsx
│   │       └── FileUpload.jsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── OwnerDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── StaffDashboard.jsx
│   │   │
│   │   ├── developer/
│   │   │   ├── UserManagement.jsx
│   │   │   ├── RoleManagement.jsx
│   │   │   ├── AuditLogPage.jsx
│   │   │   └── SystemSetting.jsx
│   │   │
│   │   ├── owner/
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── PropertyList.jsx
│   │   │   ├── PropertyDetail.jsx
│   │   │   ├── RoomTypeList.jsx
│   │   │   ├── RoomList.jsx
│   │   │   ├── TenantList.jsx
│   │   │   ├── TenantDetail.jsx
│   │   │   ├── ContractList.jsx
│   │   │   ├── InvoiceList.jsx
│   │   │   ├── InvoiceDetail.jsx
│   │   │   ├── PaymentList.jsx
│   │   │   ├── ExpenseList.jsx
│   │   │   └── ReportPage.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── TenantList.jsx
│   │   │   ├── TenantForm.jsx
│   │   │   ├── RoomList.jsx
│   │   │   ├── UtilityInput.jsx
│   │   │   ├── InvoiceList.jsx
│   │   │   ├── PaymentList.jsx
│   │   │   └── ExpenseList.jsx
│   │   │
│   │   ├── staff/
│   │   │   ├── UtilityInput.jsx
│   │   │   └── CleaningTaskList.jsx
│   │   │
│   │   └── errors/
│   │       ├── 403.jsx
│   │       └── 404.jsx
│   │
│   └── routes/
│       ├── index.jsx             (Route definitions)
│       ├── ProtectedRoute.jsx
│       └── RoleRoute.jsx
│
├── components.json               (shadcn/ui config)
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

---

## KEY BUSINESS LOGIC

### Invoice Generation Flow

```
1. Cron/Scheduler runs monthly (1st of each month)
2. For each active contract:
   a. Create invoice with invoice_number (INV-YYYYMM-XXX)
   b. Add invoice_item: Rent (monthly_price from contract)
   c. For each utility_setting of the property:
      - Get latest utility_reading for this room
      - If reading_end is NULL, use reading_start as both
      - Calculate: usage = reading_end - reading_start
      - Calculate: amount = usage × rate
      - Create invoice_item with type = utility type
   d. Sum all items → subtotal
   e. Apply discount (if any)
   f. Set total_amount
   g. Set status = 'unpaid'
   h. Set due_date = payment_day of current month
```

### Payment Confirmation Flow

```
1. Admin/Owner confirms payment
2. Payment status → 'confirmed'
3. Calculate total paid for invoice:
   - Sum all confirmed payments for this invoice
4. If total_paid >= invoice.total_amount:
   a. Invoice status → 'paid'
   b. Invoice.paid_at = now()
   c. Tenant status remains 'active'
   d. Room status remains 'occupied'
   e. Auto-generate next month's invoice
5. If total_paid < invoice.total_amount:
   a. Invoice status → 'partial'
```

### Checkout Flow

```
1. Admin initiates checkout
2. Input: checkout_date, final_meter_listrik, final_meter_air
3. System:
   a. Update tenant.status → 'checked_out'
   b. Set contract.end_date = checkout_date
   c. Set contract.status = 'completed' or 'terminated'
   d. Update room.status → 'checkout_process'
   e. Create cleaning_task for this room
   f. Finalize utility readings (set reading_end)
```

### Cleaning Workflow

```
1. Staff sees: WAITING cleaning tasks
2. Staff clicks: START → status = 'in_progress', started_at = now()
3. Staff cleans room
4. Staff clicks: DONE
   - Upload: foto_before, foto_after
   - Add notes
   - status = 'done', completed_at = now()
5. Admin/Owner verifies:
   - status = 'verified'
   - verified_by, verified_at
6. Room status: 'checkout_process' → 'cleaning' → 'ready_to_rent' → 'available'
```

---

## DATA ACCESS RULES

### Owner Scope Middleware
```php
// All queries MUST be scoped:
// For Owner: where('owner_id', auth()->user()->owner->id)
// For Admin/Staff: where('property_id', assigned_property_ids)
// For Developer: no scope (full access)
```

### Policy Examples
```php
// PropertyPolicy
public function viewAny(User $user): bool
{
    return $user->hasRole('developer') || $user->hasRole('owner');
}

public function view(User $user, Property $property): bool
{
    if ($user->hasRole('developer')) return true;
    if ($user->hasRole('owner')) return $property->owner_id === $user->owner->id;
    // Admin/Staff: check property_user pivot
    return $user->properties->contains('id', $property->id);
}
```

---

## RESPONSE FORMAT

```json
// Success
{
    "success": true,
    "message": "Data retrieved successfully",
    "data": { ... },
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "per_page": 15,
        "total": 75
    }
}

// Error
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "name": ["The name field is required."],
        "email": ["The email has already been taken."]
    }
}
```

---

## DEVELOPMENT PHASES

### Phase 1: Foundation
- [x] Database Architecture Analysis
- [ ] Install Laravel packages (Sanctum, Spatie, etc.)
- [ ] Users migration + model
- [ ] Roles & Permissions migration + seeders
- [ ] Auth (Login/Logout/Me)
- [ ] User CRUD (Developer)
- [ ] Owner Profile

### Phase 2: Property & Room
- [ ] Owner CRUD
- [ ] Property CRUD
- [ ] Room Type CRUD
- [ ] Room CRUD + Status Management
- [ ] Property-User assignment

### Phase 3: Tenant & Contract
- [ ] Tenant CRUD + KTP upload
- [ ] Check-in flow
- [ ] Contract management
- [ ] Check-out flow

### Phase 4: Billing
- [ ] Utility Settings
- [ ] Utility Readings input
- [ ] Invoice generation
- [ ] Invoice items
- [ ] Invoice PDF (optional)

### Phase 5: Payment & Finance
- [ ] Payment CRUD
- [ ] Payment confirmation flow
- [ ] Expense CRUD
- [ ] Auto invoice generation (next month)

### Phase 6: Cleaning & Operations
- [ ] Cleaning task management
- [ ] Photo upload
- [ ] Room status transitions

### Phase 7: Dashboard & Reports
- [ ] Owner Dashboard
- [ ] Admin Dashboard
- [ ] Staff Dashboard
- [ ] Finance Reports
- [ ] Occupancy Reports

### Phase 8: Frontend
- [ ] All React pages
- [ ] Data tables with TanStack Table
- [ ] Forms with validation
- [ ] Responsive design
