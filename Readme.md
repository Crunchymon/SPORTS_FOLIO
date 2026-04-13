# SportsFolio

SportsFolio is a full-stack web application designed for sports trading and portfolio management. It allows users to manage their wallet, execute trades, and track transaction history through a clean and scalable interface.

---

## Features

### Authentication
- User login and signup (frontend-ready, backend-dependent)
- Token-based authentication support

### Wallet Management
- View wallet balance
- Deposit funds
- Withdraw funds

### Trading System
- Execute trades
- Track trade history
- Backend-driven trade processing

### Dashboard
- Sidebar-based navigation
- Modular and scalable layout
- Clean and responsive UI

### UI System
- Reusable UI components (buttons, inputs, cards, tables, dialogs, toasts)
- Consistent design system

---

## Project Structure
```
SPORTS_FOLIO/
│
├── backend/
│ ├── src/
│ ├── prisma/
│ ├── docs/
│ ├── dist/
│ ├── docker-compose.yml
│ └── package.json
│
├── frontend/
│ ├── src/
│ │ ├── app/
│ │ │ ├── (dashboard)/
│ │ │ │ ├── wallet/
│ │ │ │ ├── history/
│ │ │ │ └── market/
│ │ │
│ │ ├── components/
│ │ │ ├── ui/
│ │ │ └── layout/
│ │
│ ├── public/
│ ├── .env.local
│ └── package.json
│
└── README.md
```
---

## Tech Stack

### Frontend
- Next.js (App Router)
- React.js
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Prisma ORM
- Database (via Prisma)
- Docker

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/Crunchymon/SPORTS_FOLIO.git
cd SPORTS_FOLIO