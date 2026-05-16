# Lexium – Legal Services Marketplace

A modern, full-stack legal services marketplace connecting citizens with vetted legal professionals. Built with React, Laravel, and MongoDB, featuring secure payments, transparent ratings, and a robust compliance system.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

**For Citizens:**
- Browse and book legal professionals
- Schedule appointments and consultations
- Submit and track issue complaints
- Leave verified reviews and ratings
- Secure payment processing with escrow protection

**For Providers:**
- Professional dashboard with analytics
- Manage appointments and petitions
- View performance badges and leaderboard ranking
- Receive compliance notices and guidance
- Transparent earnings ledger

**For Admins:**
- Comprehensive provider and user management
- Complaint moderation and resolution
- Issue escalation (warnings, earnings deductions, escrow holds)
- Leaderboard and performance analytics
- Audit trails for all compliance actions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TailwindCSS v4, Framer Motion |
| **Backend** | Laravel 13, PHP 8.2+ |
| **Database** | MongoDB (via laravel-mongodb) |
| **Auth** | Firebase (Citizens/Providers), MongoDB (Admins) |
| **Icons** | Lucide React |
| **Payments** | Razorpay (integrated) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ & npm/yarn
- **PHP** 8.2+ & Composer
- **MongoDB** 5.0+
- **Firebase** project with credentials
- **Razorpay** account for payments

### Installation

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`

#### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```
API runs on `http://localhost:8000`

### Environment Setup

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
```

**Backend** (`backend/.env`):
```env
DB_CONNECTION=mongodb
FIREBASE_CREDENTIALS=path_to_json_key
ADMIN_SALT=your_admin_token_salt
MAIL_MAILER=smtp
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

---

## 📁 Project Structure

```
lexium/
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── pages/        # Route components (Citizen, Provider, Admin)
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API client
│   │   └── utils/        # Helpers (auth, alerts, formatting)
│   └── vite.config.js
├── backend/              # Laravel + MongoDB
│   ├── app/
│   │   ├── Http/Controllers/  # API endpoints
│   │   ├── Models/            # MongoDB Eloquent models
│   │   └── Mail/              # Email templates
│   ├── routes/api.php
│   └── .env.example
└── README.md
```

---

## 🔑 Key Workflows

**Appointment Booking:**
```
Citizen searches → Selects provider → Books slot → 
Payment (escrow held) → Appointment confirmed → 
Service completed → Review submitted → Earnings released
```

**Complaint Filing:**
```
Citizen files issue → Admin reviews → Takes action 
(warn provider, deduct earnings, hold escrow) → 
Provider receives notice → Citizen sees timeline updates
```

**Provider Compliance:**
```
Admin issues generic notice → Provider acknowledges → 
Visible on dashboard (no complaint details exposed)
```

---

## 🔐 Authentication

- **Citizens & Providers:** Firebase email/password
- **Admins:** Direct MongoDB with bcrypt (no Firebase)
- **API:** Firebase token validation on protected routes
- **Sessions:** Stateless JWT for API

---

## 📊 API Endpoints

### Citizen Routes
```
GET    /citizen/dashboard       – Dashboard overview
GET    /citizen/petitions       – List legal cases
GET    /citizen/complaints      – View filed issues
POST   /citizen/complaints      – File a complaint
POST   /citizen/appointments/{id}/review – Submit review
```

### Provider Routes
```
GET    /provider/dashboard      – Dashboard & analytics
GET    /provider/docket         – Active cases
GET    /provider/ledger         – Earnings & transactions
GET    /provider/notices        – Compliance notices
POST   /provider/notices/{id}/acknowledge – Acknowledge notice
```

### Admin Routes
```
GET    /admin/complaints        – All complaints
PUT    /admin/complaints/{id}/status – Update status
POST   /admin/complaints/{id}/warn-provider – Issue warning
POST   /admin/complaints/{id}/deduct – Deduct earnings
POST   /admin/complaints/{id}/hold-escrow – Hold escrow
```

---

## 🎯 Core Models

| Model | Purpose |
|-------|---------|
| **User** | Base user (citizens/providers/admins) |
| **Provider** | Professional profile, ratings, earnings |
| **Petition** | Legal case with status lifecycle |
| **Appointment** | Scheduled consultation |
| **Complaint** | Issue report with resolution timeline |
| **ProviderNotice** | Generic compliance notice |
| **Transaction** | Payment/escrow tracking |

---

## 📝 Development Notes

- **Design System:** Unified color variables (CSS custom properties) in `base.css`
- **Styling:** TailwindCSS utility classes + inline styles for theme colors
- **State Management:** React hooks (useState, useContext)
- **API Client:** Axios wrapper with Firebase auth interceptor
- **Email:** Laravel Mail with Blade templates (configurable SMTP)

---

## 🐛 Testing

Run tests for each layer:

```bash
# Frontend (if tests added)
cd frontend && npm test

# Backend (PHPUnit)
cd backend && php artisan test
```

---

## 👥 Authors

**Aditya Sharma**  

---

## 💬 Support

For issues, suggestions, or contributions, please open an issue on GitHub or contact the project maintainer.

---

**Built with ❤️ for legal access & transparency.**
