# 🏠 SmartKost App

> **Modern Multi-Tenant Boarding House Management System** built with **Laravel 12**, **React**, and **MySQL**.

SmartKost App adalah aplikasi manajemen kost modern yang dirancang untuk membantu pemilik kost mengelola seluruh operasional secara digital. Sistem mendukung banyak pemilik (multi-tenant), banyak properti, serta banyak pengguna dengan hak akses yang berbeda.

---

# ✨ Features

## 🏢 Multi-Tenant SaaS

* Multiple Owners
* Data Isolation
* Subscription Ready
* Multi Property Management

## 🏠 Property Management

* Property Management
* Building Management
* Floor Management
* Room Management
* Room Categories
* Facilities Management
* Room Status

## 👥 Occupant Management

* Occupant Registration
* Check-In
* Check-Out
* Contract Management
* Identity Verification
* Occupant History
* Emergency Contact

## 💳 Billing & Payment

* Monthly Billing
* Electricity Billing
* Water Billing
* Other Charges
* Invoice Generation
* Payment History
* Payment Status
* Late Payment Tracking

## ⚡ Utility Management

* Electricity Meter
* Water Meter
* Automatic Usage Calculation
* Utility Reports

## 🛠 Maintenance

* Maintenance Requests
* Work Orders
* Technician Assignment
* Maintenance History

## 📊 Dashboard & Reports

* Revenue Dashboard
* Occupancy Rate
* Financial Reports
* Expense Reports
* Occupant Reports
* Property Reports
* Export PDF & Excel

## 👨‍💼 User & Role Management

* Developer
* Owner
* Admin
* Staff

Role & Permission powered by **Spatie Laravel Permission**.

---

# 🏗 Technology Stack

### Backend

* Laravel 12
* PHP 8.3+
* MySQL / MariaDB
* Laravel Sanctum
* Spatie Laravel Permission
* REST API

### Frontend

* React
* Vite
* Axios
* Bootstrap 5
* AdminLTE

### Deployment

* GitHub
* Vercel (Frontend)
* Railway / VPS (Backend)

---

# 📂 Project Structure

```text
smartkost-app
├── backend/
│   ├── app/
│   ├── routes/
│   ├── database/
│   ├── storage/
│   └── public/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── components/
│
└── docs/
```

---

# 👥 User Roles

## Developer

* Manage Tenants
* Subscription
* System Configuration
* Global Reports

## Owner

* Manage Properties
* Rooms
* Occupants
* Billing
* Reports
* Employees

## Admin

* Daily Operations
* Occupants
* Payments
* Utility Input
* Maintenance

## Staff

* Meter Reading
* Cleaning
* Maintenance Tasks

---

# 🔐 Authentication

* Laravel Sanctum
* API Token Authentication
* Role Based Access Control
* Permission Management

---

# 🚀 Installation

Clone repository

```bash
git clone https://github.com/your-username/smartkost-app.git
```

Backend

```bash
cd backend

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate

php artisan db:seed

php artisan serve
```

Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🌐 Environment

Backend

```env
APP_NAME=SmartKost

APP_ENV=local

APP_URL=http://localhost:8000

DB_CONNECTION=mysql

DB_DATABASE=smartkost

DB_USERNAME=root

DB_PASSWORD=
```

Frontend

```env
VITE_API_URL=http://localhost:8000/api
```

---

# 📦 Modules

* Dashboard
* Property Management
* Room Management
* Occupant Management
* Booking
* Contract
* Billing
* Payment
* Utility
* Maintenance
* Staff Management
* Reports
* Notifications
* Settings

---

# 🔄 Development Workflow

```text
Developer
      │
      ▼
GitHub Repository
      │
      ├──────────────► Vercel
      │                 (Frontend)
      │
      ▼
Railway / VPS
(Laravel Backend)
      │
      ▼
MySQL Database
```

---

# 🛣 Roadmap

* Multi Tenant SaaS
* Online Booking
* Midtrans Payment Gateway
* WhatsApp Notification
* Email Notification
* QR Code Check-In
* Mobile App (Flutter)
* AI Analytics
* Digital Contracts
* Multi Language
* Multi Currency

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Kelvin Lie**

**SmartKost App** is designed to simplify boarding house management with a modern, scalable, and professional SaaS architecture.
