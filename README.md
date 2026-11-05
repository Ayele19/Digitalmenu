# Ethiopian Café QR Menu System

A full-stack digital menu platform for Ethiopian cafés. Customers scan a QR code to browse the menu on their phones; staff manage items, categories, and settings through an admin dashboard.

---

## Features

- **Customer-facing menu** — mobile-friendly, no app required; search and filter by category
- **Admin dashboard** — stats overview with item counts, availability, and recent additions
- **Menu item management** — create, edit, delete items with image upload and availability toggle
- **Category management** — hierarchical categories (parent + sub-categories) with emoji icons
- **QR code generation** — download the menu QR as PNG or PDF, ready to print on table cards
- **Café settings** — update café name, welcome message, and logo from the dashboard
- **JWT authentication** — secure admin login with token-based sessions
- **Image handling** — server-side image upload and optimisation (Pillow)
- **Async backend** — FastAPI + async SQLAlchemy for non-blocking database calls

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Vite 5, React Query, React Router 6   |
| Styling   | Plain CSS modules, PostCSS, Tailwind CSS 3      |
| QR / PDF  | qrcode.react, jsPDF, html2canvas                |
| Backend   | FastAPI, Uvicorn, SQLAlchemy (async), Alembic   |
| Auth      | python-jose (JWT), passlib (bcrypt)             |
| Database  | PostgreSQL 15, asyncpg driver                   |
| Images    | Pillow, aiofiles                                |

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** (npm included)
- **PostgreSQL 15+**

---

## Database Setup

Create the database before starting the backend:

```bash
createdb qrmenu
```

Or using psql:

```sql
CREATE DATABASE qrmenu;
```

---

## Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy the environment file and edit it
copy .env.example .env        # Windows
cp .env.example .env          # macOS / Linux
```

Open `.env` and update at minimum:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<your-password>@localhost:5432/qrmenu
SECRET_KEY=<a-long-random-string>
```

Start the backend (tables are created automatically on first run and the admin seed runs):

```bash
uvicorn app.main:app --reload --port 8000
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy the environment file
copy .env.example .env        # Windows
cp .env.example .env          # macOS / Linux
```

`.env` defaults work out of the box for local development:

```env
VITE_API_URL=http://localhost:8000
VITE_MENU_URL=http://localhost:5173
```

Start the dev server:

```bash
npm run dev
```

To produce a production build:

```bash
npm run build
```

---

## Default Admin Credentials

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

Change these from the Settings page after first login.

---

## URLs

| What               | URL                          |
|--------------------|------------------------------|
| Customer menu      | http://localhost:5173        |
| Admin login        | http://localhost:5173/admin/login |
| Admin dashboard    | http://localhost:5173/admin/dashboard |
| API interactive docs | http://localhost:8000/docs |
| API redoc          | http://localhost:8000/redoc  |

---

## QR Code Instructions

1. Log in to the admin dashboard.
2. Navigate to **QR Code** in the sidebar.
3. Click **Download PNG** for a high-resolution image, or **Download PDF** for a print-ready A4 sheet.
4. Print at a minimum size of 3 × 3 cm so phones can scan reliably from across a table.
5. Laminate table cards to protect them from spills.
6. The QR code always points to `VITE_MENU_URL`. It never changes when you update items or prices — print once, use forever.

---

## Project Structure

```
Qrmenu/
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── main.py               # FastAPI app, startup, CORS
│       ├── config.py             # Pydantic settings (reads .env)
│       ├── database.py           # Async SQLAlchemy engine & session
│       ├── core/
│       │   ├── dependencies.py   # get_current_user dependency
│       │   └── security.py       # JWT encode/decode, password hashing
│       ├── models/
│       │   ├── admin.py          # Admin user ORM model
│       │   ├── category.py       # Category ORM model
│       │   ├── menu_item.py      # MenuItem ORM model
│       │   └── settings.py       # CafeSettings ORM model
│       ├── routers/
│       │   ├── auth.py           # POST /auth/login
│       │   ├── categories.py     # CRUD /categories
│       │   ├── menu_items.py     # CRUD /menu-items (with image upload)
│       │   ├── public.py         # GET /public/menu, /public/settings
│       │   └── settings.py       # GET/PATCH /settings
│       ├── schemas/              # Pydantic request/response models
│       └── utils/
│           ├── image_utils.py    # Image resize & save (Pillow)
│           └── seed.py           # Admin user seeding on startup
│
└── frontend/
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx              # React root, QueryClient, Toaster
        ├── App.jsx               # Router, AuthProvider, AdminLayout
        ├── index.css
        ├── api/                  # Axios wrappers per resource
        │   ├── axios.js          # Base Axios instance + interceptors
        │   ├── auth.js
        │   ├── categories.js
        │   ├── menuItems.js
        │   ├── public.js
        │   └── settings.js
        ├── components/
        │   ├── admin/
        │   │   ├── MenuItemForm.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── StatsCard.jsx
        │   ├── common/
        │   │   ├── ConfirmDialog.jsx
        │   │   ├── ImageUpload.jsx
        │   │   └── LoadingSpinner.jsx
        │   └── menu/
        │       ├── CategoryFilter.jsx
        │       ├── MenuCard.jsx
        │       └── SearchBar.jsx
        ├── context/
        │   └── AuthContext.jsx   # Auth state + ProtectedRoute
        ├── pages/
        │   ├── admin/
        │   │   ├── LoginPage.jsx
        │   │   ├── DashboardPage.jsx
        │   │   ├── MenuItemsPage.jsx
        │   │   ├── CategoriesPage.jsx
        │   │   ├── QRCodePage.jsx
        │   │   └── SettingsPage.jsx
        │   └── customer/
        │       └── MenuPage.jsx
        ├── styles/               # Per-component CSS files
        └── utils/
            └── formatters.js     # formatPrice, formatDate helpers
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable                    | Default / Example                                          | Description                        |
|-----------------------------|------------------------------------------------------------|------------------------------------|
| `DATABASE_URL`              | `postgresql+asyncpg://postgres:password@localhost/qrmenu` | Async PostgreSQL connection string |
| `SECRET_KEY`                | *(required)*                                               | JWT signing secret                 |
| `ALGORITHM`                 | `HS256`                                                    | JWT algorithm                      |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `43200` (30 days)                                       | Token lifetime                     |
| `UPLOAD_DIR`                | `uploads/images`                                           | Image storage path                 |
| `FRONTEND_URL`              | `http://localhost:5173`                                    | CORS allowed origin                |

### Frontend (`frontend/.env`)

| Variable        | Default                    | Description                      |
|-----------------|----------------------------|----------------------------------|
| `VITE_API_URL`  | `http://localhost:8000`    | Backend base URL                 |
| `VITE_MENU_URL` | `http://localhost:5173`    | Public menu URL embedded in QR   |
