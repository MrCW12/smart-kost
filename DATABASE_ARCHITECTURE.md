# SMARTKOST MANAGEMENT - DATABASE ARCHITECTURE

## SYSTEM OVERVIEW

```
Developer (Superadmin)
    │
    ├── Owner 1 ──┬── Location A ──┬── Room A01 ── Tenant
    │              │               ├── Room A02 ── Tenant
    │              │               └── Room A03
    │              │
    │              └── Location B ──┬── Room B01 ── Tenant
    │                              └── Room B02
    │
    └── Owner 2 ──┬── Location C ──┬── Room C01 ── Tenant
                  │               └── Room C02 ── Tenant
                  └── Location D ── Room D01
```

---

## ROLE PERMISSION MATRIX

| Module | Feature | Developer | Owner | Admin | Staff |
|--------|---------|-----------|-------|-------|-------|
| **USER** | Kelola user | ✅ | ❌ | ❌ | ❌ |
| **ROLE** | Kelola role & permission | ✅ | ❌ | ❌ | ❌ |
| **SYSTEM** | System setting | ✅ | ❌ | ❌ | ❌ |
| **OWNER** | Kelola semua owner | ✅ | ❌ | ❌ | ❌ |
| **OWNER** | Lihat own profile | ✅ | ✅ | ❌ | ❌ |
| **LOCATION** | CRUD lokasi kost | ✅ | ✅ | ❌ | ❌ |
| **LOCATION** | Lihat lokasi assigned | ✅ | ✅ | ✅ | ✅ |
| **ROOM TYPE** | CRUD tipe kamar | ✅ | ✅ | ❌ | ❌ |
| **ROOM** | CRUD kamar | ✅ | ✅ | 👁️ | ❌ |
| **ROOM** | Update status kamar | ✅ | ✅ | ✅ | ❌ |
| **TENANT** | CRUD penghuni | ✅ | ✅ | ✅ | ❌ |
| **TENANT** | Upload KTP | ✅ | ✅ | ✅ | ❌ |
| **CONTRACT** | Buat/edit kontrak | ✅ | ✅ | ✅ | ❌ |
| **CONTRACT** | Check-in / Check-out | ✅ | ✅ | ✅ | ❌ |
| **UTILITY** | Input meter listrik/air | ✅ | ✅ | ✅ | ✅ |
| **UTILITY** | Lihat utility settings | ✅ | ✅ | ✅ | ❌ |
| **BILLING** | Generate invoice | ✅ | ✅ | ✅ | ❌ |
| **BILLING** | Lihat invoice | ✅ | ✅ | ✅ | ❌ |
| **BILLING** | Konfirmasi pembayaran | ✅ | ✅ | ✅ | ❌ |
| **PAYMENT** | Lihat pembayaran | ✅ | ✅ | ✅ | ❌ |
| **EXPENSE** | CRUD pengeluaran | ✅ | ✅ | ✅ | ❌ |
| **CLEANING** | Lihat tugas cleaning | ✅ | ✅ | ✅ | ✅ |
| **CLEANING** | Update status & foto | ✅ | ✅ | ✅ | ✅ |
| **REPORT** | Pendapatan & profit | ✅ | ✅ | ❌ | ❌ |
| **REPORT** | Penghuni & kamar | ✅ | ✅ | ✅ | ❌ |
| **DASHBOARD** | Owner dashboard | ✅ | ✅ | ❌ | ❌ |
| **DASHBOARD** | Admin dashboard | ✅ | ✅ | ✅ | ❌ |
| **DASHBOARD** | Staff dashboard | ✅ | ✅ | ✅ | ✅ |

---

## DATABASE SCHEMA

### 1. USERS MODULE

#### Table: `users` (extend default)
```sql
users
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── name                VARCHAR(255)
├── email               VARCHAR(255) UNIQUE
├── email_verified_at   TIMESTAMP NULL
├── password            VARCHAR(255)
├── phone               VARCHAR(20) NULL
├── avatar              VARCHAR(500) NULL
├── is_active           BOOLEAN DEFAULT TRUE
├── last_login_at       TIMESTAMP NULL
├── remember_token      VARCHAR(100) NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

#### Table: `personal_access_tokens` (Sanctum)
```
-managed by Laravel Sanctum-
```

#### Table: `roles` (Spatie)
```
-managed by Spatie Permission-
```

#### Table: `permissions` (Spatie)
```
-managed by Spatie Permission-
```

#### Table: `model_has_roles` (Spatie)
```
-managed by Spatie Permission-
```

#### Table: `model_has_permissions` (Spatie)
```
-managed by Spatie Permission-
```

#### Table: `role_has_permissions` (Spatie)
```
-managed by Spatie Permission-
```

---

### 2. OWNER MODULE

#### Table: `owners`
```sql
owners
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── user_id             BIGINT UNSIGNED FK → users.id ON DELETE CASCADE
├── company_name        VARCHAR(255) NULL
├── nik                 VARCHAR(20) NULL
├── phone               VARCHAR(20) NULL
├── address             TEXT NULL
├── bank_name           VARCHAR(100) NULL
├── bank_account_number VARCHAR(50) NULL
├── bank_account_name   VARCHAR(255) NULL
├── status              ENUM('active','inactive') DEFAULT 'active'
├── notes               TEXT NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `owner → user` (belongsTo)
- `owner → properties` (hasMany)
- `owner → users` (hasMany through - admin/staff assigned)

---

### 3. LOCATION MODULE

#### Table: `properties` (Lokasi Kost)
```sql
properties
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── owner_id            BIGINT UNSIGNED FK → owners.id ON DELETE CASCADE
├── name                VARCHAR(255)  -- "Kost Melati"
├── slug                VARCHAR(255) UNIQUE
├── address             TEXT
├── city                VARCHAR(100)
├── province            VARCHAR(100)
├── postal_code         VARCHAR(10) NULL
├── phone               VARCHAR(20) NULL
├── description         TEXT NULL
├── latitude            DECIMAL(10,8) NULL
├── longitude           DECIMAL(11,8) NULL
├── is_active           BOOLEAN DEFAULT TRUE
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `property → owner` (belongsTo)
- `property → rooms` (hasMany)
- `property → utilitySettings` (hasMany)
- `property → user` (belongsTo - assigned admin/staff)

#### Table: `property_user` (Pivot - Admin/Staff per Lokasi)
```sql
property_user
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── user_id             BIGINT UNSIGNED FK → users.id ON DELETE CASCADE
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

---

### 4. ROOM MODULE

#### Table: `room_types` (Tipe Kamar)
```sql
room_types
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── name                VARCHAR(255)  -- "Standard", "VIP", "Deluxe"
├── description         TEXT NULL
├── base_price          DECIMAL(12,2)  -- Harga dasar
├── capacity            INT DEFAULT 1
├── facilities          JSON NULL  -- ["AC","WiFi","Kasur","Lemari"]
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `roomType → property` (belongsTo)
- `roomType → rooms` (hasMany)

#### Table: `rooms` (Kamar)
```sql
rooms
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── room_type_id        BIGINT UNSIGNED FK → room_types.id ON DELETE SET NULL
├── number              VARCHAR(20)  -- "A01", "B02"
├── floor               VARCHAR(10) NULL  -- "1", "2", "G"
├── price               DECIMAL(12,2)  -- Harga spesifik kamar ini
├── status              ENUM('available','occupied','checkout_process','cleaning','ready_to_rent','maintenance') DEFAULT 'available'
├── description         TEXT NULL
├── notes               TEXT NULL
├── is_active           BOOLEAN DEFAULT TRUE
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `room → property` (belongsTo)
- `room → roomType` (belongsTo)
- `room → contracts` (hasMany)
- `room → utilityReadings` (hasMany)
- `room → cleaningTasks` (hasMany)

**Status Flow:**
```
available → occupied (check-in)
occupied → checkout_process (check-out initiated)
checkout_process → cleaning (cleaner starts)
cleaning → ready_to_rent (cleaning done)
ready_to_rent → available (verified)
available ↔ maintenance (maintenance mode)
```

---

### 5. TENANT MODULE

#### Table: `tenants` (Penghuni)
```sql
tenants
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── user_id             BIGINT UNSIGNED FK → users.id NULL ON DELETE SET NULL
├── name                VARCHAR(255)
├── nik                 VARCHAR(20)  -- NIK KTP
├── ktp_photo           VARCHAR(500) NULL  -- path foto KTP
├── phone               VARCHAR(20)
├── email               VARCHAR(255) NULL
├── address             TEXT  -- Alamat asal
├── occupation          VARCHAR(100) NULL
├── emergency_contact   VARCHAR(255) NULL
├── emergency_phone     VARCHAR(20) NULL
├── status              ENUM('active','checked_out','blacklisted') DEFAULT 'active'
├── notes               TEXT NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `tenant → user` (belongsTo - optional, for tenant portal)
- `tenant → contracts` (hasMany)
- `tenant → invoices` (hasMany)
- `tenant → payments` (hasMany)

---

### 6. CONTRACT MODULE

#### Table: `contracts` (Kontrak Sewa)
```sql
contracts
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── tenant_id           BIGINT UNSIGNED FK → tenants.id ON DELETE CASCADE
├── room_id             BIGINT UNSIGNED FK → rooms.id ON DELETE CASCADE
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── contract_number     VARCHAR(50) UNIQUE  -- "CTR-202608-001"
├── start_date          DATE
├── end_date            DATE NULL  -- NULL = perpetual
├── monthly_price       DECIMAL(12,2)
├── deposit_amount      DECIMAL(12,2) DEFAULT 0
├── payment_day         INT DEFAULT 1  -- Tanggal jatuh tempo
├── status              ENUM('active','expired','terminated','completed') DEFAULT 'active'
├── notes               TEXT NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `contract → tenant` (belongsTo)
- `contract → room` (belongsTo)
- `contract → property` (belongsTo)
- `contract → invoices` (hasMany)

---

### 7. BILLING MODULE

#### Table: `utility_settings` (Tarif Utilitas per Lokasi)
```sql
utility_settings
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── type                ENUM('electricity','water','internet','parking','garbage','other')
├── name                VARCHAR(100)  -- "Listrik", "Air"
├── unit                VARCHAR(20)   -- "kWh", "m3"
├── rate                DECIMAL(12,2) -- Tarif per unit
├── min_usage           DECIMAL(12,2) DEFAULT 0
├── is_active           BOOLEAN DEFAULT TRUE
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `utilitySetting → property` (belongsTo)

#### Table: `utility_readings` (Catatan Meter)
```sql
utility_readings
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── room_id             BIGINT UNSIGNED FK → rooms.id ON DELETE CASCADE
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── utility_setting_id  BIGINT UNSIGNED FK → utility_settings.id ON DELETE CASCADE
├── contract_id         BIGINT UNSIGNED FK → contracts.id ON DELETE CASCADE
├── period_month        INT  -- 1-12
├── period_year         INT  -- 2026
├── reading_start       DECIMAL(12,2)  -- Meter awal
├── reading_end         DECIMAL(12,2) NULL  -- Meter akhir (diisi saat checkout/billing)
├── usage_amount        DECIMAL(12,2) NULL  -- reading_end - reading_start
├── amount              DECIMAL(12,2) NULL  -- usage × rate
├── input_by            BIGINT UNSIGNED FK → users.id NULL
├── input_at            TIMESTAMP NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

UNIQUE(room_id, utility_setting_id, period_month, period_year)
```

**Relationships:**
- `utilityReading → room` (belongsTo)
- `utilityReading → property` (belongsTo)
- `utilityReading → utilitySetting` (belongsTo)
- `utilityReading → contract` (belongsTo)
- `utilityReading → user` (belongsTo - inputBy)

#### Table: `invoices` (Tagihan Bulanan)
```sql
invoices
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── tenant_id           BIGINT UNSIGNED FK → tenants.id ON DELETE CASCADE
├── room_id             BIGINT UNSIGNED FK → rooms.id ON DELETE CASCADE
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── contract_id         BIGINT UNSIGNED FK → contracts.id ON DELETE CASCADE
├── invoice_number      VARCHAR(50) UNIQUE  -- "INV-202608-001"
├── period_month        INT  -- 1-12
├── period_year         INT  -- 2026
├── due_date            DATE  -- Jatuh tempo
├── subtotal            DECIMAL(12,2)  -- Total sebelum diskon
├── discount            DECIMAL(12,2) DEFAULT 0
├── total_amount        DECIMAL(12,2)  -- Final amount
├── status              ENUM('draft','unpaid','partial','paid','overdue','cancelled') DEFAULT 'draft'
├── notes               TEXT NULL
├── paid_at             TIMESTAMP NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

UNIQUE(tenant_id, period_month, period_year)
```

**Relationships:**
- `invoice → tenant` (belongsTo)
- `invoice → room` (belongsTo)
- `invoice → property` (belongsTo)
- `invoice → contract` (belongsTo)
- `invoice → items` (hasMany)
- `invoice → payments` (hasMany)

#### Table: `invoice_items` (Detail Tagihan)
```sql
invoice_items
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── invoice_id          BIGINT UNSIGNED FK → invoices.id ON DELETE CASCADE
├── type                ENUM('rent','electricity','water','internet','parking','garbage','other')
├── name                VARCHAR(255)  -- "Sewa Kamar", "Listrik", "Air"
├── description         TEXT NULL
├── quantity            DECIMAL(12,2) DEFAULT 1
├── unit_price          DECIMAL(12,2)
├── amount              DECIMAL(12,2)  -- quantity × unit_price
├── metadata            JSON NULL  -- {"reading_start":1250,"reading_end":1325,"usage":75,"rate":2000}
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `invoiceItem → invoice` (belongsTo)

---

### 8. PAYMENT MODULE

#### Table: `payments` (Pembayaran)
```sql
payments
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── invoice_id          BIGINT UNSIGNED FK → invoices.id ON DELETE CASCADE
├── tenant_id           BIGINT UNSIGNED FK → tenants.id ON DELETE CASCADE
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── payment_number      VARCHAR(50) UNIQUE  -- "PAY-202608-001"
├── amount              DECIMAL(12,2)
├── payment_method      ENUM('cash','bank_transfer','ewallet','other') DEFAULT 'cash'
├── bank_name           VARCHAR(100) NULL
├── bank_account_number VARCHAR(50) NULL
├── reference_number    VARCHAR(100) NULL  -- No referensi transfer
├── payment_date        DATE
├── notes               TEXT NULL
├── proof               VARCHAR(500) NULL  -- path bukti bayar
├── status              ENUM('pending','confirmed','rejected') DEFAULT 'pending'
├── confirmed_by        BIGINT UNSIGNED FK → users.id NULL
├── confirmed_at        TIMESTAMP NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `payment → invoice` (belongsTo)
- `payment → tenant` (belongsTo)
- `payment → property` (belongsTo)
- `payment → user` (belongsTo - confirmedBy)

---

### 9. EXPENSE MODULE

#### Table: `expense_categories` (Kategori Pengeluaran)
```sql
expense_categories
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── name                VARCHAR(255)  -- "Listrik", "Air", "Maintenance"
├── description         TEXT NULL
├── is_active           BOOLEAN DEFAULT TRUE
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

#### Table: `expenses` (Pengeluaran)
```sql
expenses
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── expense_category_id BIGINT UNSIGNED FK → expense_categories.id ON DELETE SET NULL
├── title               VARCHAR(255)
├── description         TEXT NULL
├── amount              DECIMAL(12,2)
├── expense_date        DATE
├── receipt             VARCHAR(500) NULL  -- path foto struk
├── payment_method      ENUM('cash','bank_transfer','ewallet','other') DEFAULT 'cash'
├── created_by          BIGINT UNSIGNED FK → users.id
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `expense → property` (belongsTo)
- `expense → expenseCategory` (belongsTo)
- `expense → user` (belongsTo - createdBy)

---

### 10. CLEANING MODULE

#### Table: `cleaning_tasks` (Tugas Kebersihan)
```sql
cleaning_tasks
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── property_id         BIGINT UNSIGNED FK → properties.id ON DELETE CASCADE
├── room_id             BIGINT UNSIGNED FK → rooms.id ON DELETE CASCADE
├── assigned_to         BIGINT UNSIGNED FK → users.id NULL ON DELETE SET NULL
├── type                ENUM('checkout','periodic','maintenance','request') DEFAULT 'checkout'
├── status              ENUM('waiting','in_progress','done','verified') DEFAULT 'waiting'
├── priority            ENUM('low','medium','high','urgent') DEFAULT 'medium'
├── notes               TEXT NULL
├── started_at          TIMESTAMP NULL
├── completed_at        TIMESTAMP NULL
├── verified_by         BIGINT UNSIGNED FK → users.id NULL
├── verified_at         TIMESTAMP NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Relationships:**
- `cleaningTask → property` (belongsTo)
- `cleaningTask → room` (belongsTo)
- `cleaningTask → assignedUser` (belongsTo - assignedTo)
- `cleaningTask → verifiedUser` (belongsTo - verifiedBy)
- `cleaningTask → photos` (hasMany)

#### Table: `cleaning_task_photos` (Foto Cleaning)
```sql
cleaning_task_photos
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── cleaning_task_id    BIGINT UNSIGNED FK → cleaning_tasks.id ON DELETE CASCADE
├── path                VARCHAR(500)
├── type                ENUM('before','after','during') DEFAULT 'before'
├── caption             VARCHAR(255) NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

---

### 11. ADDITIONAL MODULES

#### Table: `audit_logs` (Developer Only)
```sql
audit_logs
├── id                  BIGINT UNSIGNED PK AUTO_INCREMENT
├── user_id             BIGINT UNSIGNED FK → users.id NULL
├── action              VARCHAR(100)  -- "create","update","delete","login"
├── model_type          VARCHAR(255) NULL
├── model_id            BIGINT UNSIGNED NULL
├── old_values          JSON NULL
├── new_values          JSON NULL
├── ip_address          VARCHAR(45) NULL
├── user_agent          TEXT NULL
├── created_at          TIMESTAMP
```

#### Table: `notifications` (Optional)
```sql
notifications
├── id                  CHAR(36) PK (UUID)
├── type                VARCHAR(255)
├── notifiable_type     VARCHAR(255)
├── notifiable_id       BIGINT UNSIGNED
├── data                JSON
├── read_at             TIMESTAMP NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

---

## ENTITY RELATIONSHIP DIAGRAM (TEXT)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    users    │────<│    roles     │────<│ permissions │
│             │     │ (Spatie)    │     │ (Spatie)    │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       ├──1:1── owners
       │            │
       │            ├──1:N── properties ──< rooms ──< contracts ──< tenants
       │            │            │            │            │
       │            │            │            │            └──1:N── invoices ──< invoice_items
       │            │            │            │                         │
       │            │            │            │                         └──1:N── payments
       │            │            │            │
       │            │            │            └──1:N── utility_readings
       │            │            │
       │            │            └──1:N── utility_settings
       │            │
       │            └──1:N── expenses
       │
       ├──M:N── properties (admin/staff assigned)
       │
       ├──1:N── cleaning_tasks ──< cleaning_task_photos
       │
       └──1:N── audit_logs
```

---

## MIGRATION ORDER

```
1.  users (extend default)
2.  personal_access_tokens (Sanctum)
3.  roles, permissions, model_has_roles, model_has_permissions, role_has_permissions (Spatie)
4.  owners
5.  properties
6.  property_user (pivot)
7.  room_types
8.  rooms
9.  tenants
10. contracts
11. utility_settings
12. utility_readings
13. invoices
14. invoice_items
15. payments
16. expense_categories
17. expenses
18. cleaning_tasks
19. cleaning_task_photos
20. audit_logs
```

---

## SEEDER PLAN

```
1. RoleSeeder         → developer, owner, admin, staff
2. PermissionSeeder   → All permissions per module
3. RoleHasPermissionSeeder → Assign permissions to roles
4. UserSeeder         → Developer + sample owner
5. OwnerSeeder        → Sample owners
6. PropertySeeder     → Sample kost locations
7. RoomTypeSeeder     → Standard, VIP, Deluxe
8. RoomSeeder         → Sample rooms per property
9. TenantSeeder       → Sample tenants
10. ContractSeeder    → Sample contracts
11. UtilitySettingSeeder → Default tariffs
12. ExpenseCategorySeeder → Default categories
```

---

## PERMISSION LIST (SPATIE)

### User Management
- `user.view`
- `user.create`
- `user.update`
- `user.delete`

### Role Management
- `role.view`
- `role.create`
- `role.update`
- `role.delete`

### Owner Management
- `owner.view`
- `owner.create`
- `owner.update`
- `owner.delete`
- `owner.switch` (Developer only)

### Property/Location
- `property.view`
- `property.create`
- `property.update`
- `property.delete`

### Room Type
- `room-type.view`
- `room-type.create`
- `room-type.update`
- `room-type.delete`

### Room
- `room.view`
- `room.create`
- `room.update`
- `room.delete`
- `room.update-status`

### Tenant
- `tenant.view`
- `tenant.create`
- `tenant.update`
- `tenant.delete`
- `tenant.upload-ktp`
- `tenant.check-in`
- `tenant.check-out`

### Contract
- `contract.view`
- `contract.create`
- `contract.update`
- `contract.terminate`

### Utility
- `utility.view`
- `utility.setting`
- `utility.input-reading`

### Invoice
- `invoice.view`
- `invoice.generate`
- `invoice.update`
- `invoice.cancel`

### Payment
- `payment.view`
- `payment.create`
- `payment.confirm`
- `payment.reject`

### Expense
- `expense.view`
- `expense.create`
- `expense.update`
- `expense.delete`

### Cleaning
- `cleaning.view`
- `cleaning.assign`
- `cleaning.update`
- `cleaning.verify`

### Report
- `report.finance`
- `report.occupancy`
- `report.tenant`

### System (Developer Only)
- `system.setting`
- `system.audit-log`
- `system.monitoring`

---

## API ROUTE STRUCTURE

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/register (owner self-register)
GET    /api/auth/me
PUT    /api/auth/profile

# Developer Only
GET    /api/developers/users
POST   /api/developers/users
GET    /api/developers/roles
POST   /api/developers/roles
GET    /api/developers/permissions
GET    /api/developers/audit-logs
POST   /api/developers/switch-owner/{id}

# Owner Profile
GET    /api/owner/profile
PUT    /api/owner/profile

# Properties
GET    /api/properties
POST   /api/properties
GET    /api/properties/{id}
PUT    /api/properties/{id}
DELETE /api/properties/{id}

# Room Types
GET    /api/properties/{propertyId}/room-types
POST   /api/properties/{propertyId}/room-types
PUT    /api/room-types/{id}
DELETE /api/room-types/{id}

# Rooms
GET    /api/properties/{propertyId}/rooms
POST   /api/properties/{propertyId}/rooms
GET    /api/rooms/{id}
PUT    /api/rooms/{id}
DELETE /api/rooms/{id}
PATCH  /api/rooms/{id}/status

# Tenants
GET    /api/tenants
POST   /api/tenants
GET    /api/tenants/{id}
PUT    /api/tenants/{id}
DELETE /api/tenants/{id}
POST   /api/tenants/{id}/check-in
POST   /api/tenants/{id}/check-out

# Contracts
GET    /api/contracts
GET    /api/contracts/{id}
PUT    /api/contracts/{id}

# Utility Settings
GET    /api/properties/{propertyId}/utility-settings
POST   /api/properties/{propertyId}/utility-settings
PUT    /api/utility-settings/{id}
DELETE /api/utility-settings/{id}

# Utility Readings
GET    /api/utility-readings
POST   /api/utility-readings
GET    /api/utility-readings/{id}
PUT    /api/utility-readings/{id}

# Invoices
GET    /api/invoices
POST   /api/invoices/generate
GET    /api/invoices/{id}
PATCH  /api/invoices/{id}/status
GET    /api/invoices/{id}/pdf

# Payments
GET    /api/payments
POST   /api/payments
GET    /api/payments/{id}
PATCH  /api/payments/{id}/confirm
PATCH  /api/payments/{id}/reject

# Expenses
GET    /api/expenses
POST   /api/expenses
GET    /api/expenses/{id}
PUT    /api/expenses/{id}
DELETE /api/expenses/{id}

# Cleaning Tasks
GET    /api/cleaning-tasks
POST   /api/cleaning-tasks
GET    /api/cleaning-tasks/{id}
PATCH  /api/cleaning-tasks/{id}/status
POST   /api/cleaning-tasks/{id}/photos

# Dashboard
GET    /api/dashboard/owner
GET    /api/dashboard/admin
GET    /api/dashboard/staff

# Reports
GET    /api/reports/finance
GET    /api/reports/occupancy
GET    /api/reports/tenant
```

---

## DATA ISOLATION BY ROLE

| Role | Data Scope |
|------|-----------|
| Developer | ALL data across all owners |
| Owner | Only own properties, rooms, tenants, invoices |
| Admin | Only assigned properties (via property_user) |
| Staff | Only assigned properties (via property_user) - limited fields |

All queries MUST be scoped by `owner_id` (or `property_id` for admin/staff).
