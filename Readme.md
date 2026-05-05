# SportsFolio

> **Fund the players. Believe from the start. Share in the success.**

A donation-backed investment platform where Ranji Trophy cricketers get funded by their believers, and those believers get rewarded when the athlete succeeds.

---

## The Problem

India's best domestic cricketers cannot afford equipment. When they need money, they call family and friends. That money is given informally, with no return even if the player becomes the next Virat Kohli.

**SportsFolio formalizes this into a structured financial product.**

---

## How It Works

Every investment is split between two things:

1. **Donation** -> Goes directly to the athlete (immediate funding)
2. **Pool deposit** -> Backs tradeable tokens (potential returns)

The split ratio shifts automatically based on price:

```text
+---------------------------------------------------------+
|  Early Stage (Price is approx Rs 0)                     |
|  ████████████████████████████████████████████ 90%       | -> Athlete
|  █████ 10%                                              | -> Pool
|                                                         |
|  Mid Stage (Price is approx Rs 100)                     |
|  ██████████████████████ 45%                             | -> Athlete
|  ██████████████████████ 55%                             | -> Pool
|                                                         |
|  Late Stage (Price is High)                             |
|  █ 1%                                                   | -> Athlete
|  ████████████████████████████████████████████ 99%       | -> Pool
+---------------------------------------------------------+
```

**Why this works:**
- Early believers get **massive token quantities** at near-zero prices (despite lower pool percentage)
- Athletes get funded at every stage
- Late investors provide deep liquidity
- Everyone wins if the athlete succeeds

---

## The Core Innovation

**Quadratic bonding curve** + **Variable pool ratio** = Forced coupling between donation and investment.

You cannot invest without donating. Early believers fund the success that funds their return.

### The Math (For The Curious)

```text
Price = k * Supply^2
Pool Ratio = 10% + 89% * (Price / (Price + P_mid))
```

**Real example:**

| Investor | Paid | Pool Deposit | Donation | Tokens | Exit Value* |
|----------|------|--------------|----------|--------|-------------|
| Early    | Rs 1,000 | Rs 100 (10%) | Rs 900 | **31.07** | **Rs 76,000+** |
| Late     | Rs 1,000 | Rs 900 (90%) | Rs 100 | **1.38** | **Rs 3,500** |

*At supply = 512 tokens*

The early investor's profit comes from later investors' pool deposits. But unlike pure speculation, **real value was created**: an athlete was funded.

---

## Architecture

```text
+--------------+
|   Next.js    |  <- Trading UI, Real-time Charts
+------+-------+
       |
+------v------------------------------------+
|         Node.js + Express API             |
|  * JWT Auth  * Trade Queue  * WebSocket   |
+------+-----------+-----------+------------+
       |           |           |
   +---v--+    +--v---+   +---v----+
   |Redis |    |PG    |   |BullMQ  |
   |Cache |    |Prisma|   |Queue   |
   +------+    +------+   +--------+
```

**Key Tech:**
- **Decimal.js**: Arbitrary precision math (never floating point for money)
- **Bonding Curve Engine**: Pure pricing logic, independently testable
- **Per-athlete trade queues**: Eliminates race conditions
- **Append-only ledger**: Complete audit trail, balances always reconstructable
- **Idempotency keys**: Network retries are always safe

---

## Quick Start

Follow these detailed setup instructions to get SportsFolio running locally.

### Prerequisites
- Node.js 20 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- Docker and Docker Compose (if using the recommended setup)

### With Docker (Recommended)

This is the fastest way to get the entire stack running.

```bash
git clone https://github.com/Crunchymon/SPORTS_FOLIO.git
cd SPORTS_FOLIO

# Start all required services (database, redis, etc.)
docker compose up -d

# Setup the backend
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Run the backend
npm run dev

# Open a new terminal and setup the frontend
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

### Manual Setup

If you prefer running services directly on your host machine without Docker:

**1. Database and Cache:**
Ensure PostgreSQL is running and accessible. Ensure Redis is running locally on port 6379.

**2. Backend:**
```bash
cd backend
npm install

# Copy the example environment file and configure your database URL
cp .env.example .env

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Start the development server
npm run dev
```
The API will run on `http://localhost:3001`.

**3. Frontend:**
```bash
cd frontend
npm install

# Configure environment variables
cp .env.example .env

# Start the frontend application
npm run dev
```
The UI will be accessible at `http://localhost:3000`.

---

## Core API Endpoints

### Authentication
```http
POST   /auth/register      # Create account
POST   /auth/login         # Get JWT token
POST   /auth/kyc/verify    # Verify KYC (required for trades)
```

### Wallet
```http
POST   /wallet/deposit     # Add funds (1% platform fee)
POST   /wallet/withdraw    # Request withdrawal (24hr queue)
GET    /wallet/balance     # Current balance
```

### Trading
```http
GET    /athletes           # List all athletes (paginated, sortable)
GET    /athletes/:id       # Athlete details + price chart
POST   /trade/buy          # Buy tokens (requires X-Idempotency-Key header)
POST   /trade/sell         # Sell tokens (requires X-Idempotency-Key header)
GET    /trade/history      # Your trade history
```

### Portfolio
```http
GET    /portfolio          # Your holdings across all athletes
```

**Full API spec:** See `backend/docs/openapi.yaml`

---

## What Makes This Bulletproof

### Financial Integrity
- **No floating point**: All money calculations use Decimal.js (28-digit precision)
- **Append-only ledger**: Every transaction creates immutable history
- **Idempotent trades**: UUID-based, network retries never double-charge
- **Race condition defense**: Per-athlete queues + SELECT FOR UPDATE + optimistic locking
- **Daily reconciliation**: Pool balance verified against curve integral every night

### Security
- **JWT authentication**: Stateless, horizontally scalable
- **KYC verification**: Configurable enforcement for deposits, withdrawals, and trades
- **Rate limiting**: Per-user, per-endpoint protection
- **Circuit breakers**: Automatic trading halts on suspicious activity

---

## Bot Trading System

At launch, a lack of real users might lead to flat price charts and no engagement.

**Solution:** System bots create organic-looking market activity from day one.

### Built-in Strategies
- **Momentum Bot**: Trend following (amplifies genuine moves)
- **Mean Reversion Bot**: Statistical anchoring (prevents runaway prices)
- **Noise Trader Bot**: Random chaos (simulates retail investors)

### User-Configurable Bots
Investors can create custom bots via the UI (no coding required):
- Trigger: Price change percentage, Moving average crossover, or Time interval
- Trade size: Fixed INR or percentage of wallet
- Stop loss / Take profit thresholds
- Cooldown periods

**Live leaderboard ranks all bots by ROI.**

Bot activity is **explicitly labeled** in the UI, not hidden.

---

## Project Structure

```text
SPORTS_FOLIO/
+-- backend/
|   +-- src/
|   |   +-- services/        # Business logic
|   |   |   +-- BondingCurveEngine.js
|   |   |   +-- TradeService.js
|   |   |   +-- WalletService.js
|   |   +-- bots/            # Bot trading system
|   |   +-- routes/          # API endpoints
|   |   +-- middleware/      # Auth, validation, rate limiting
|   |   +-- queues/          # BullMQ job processors
|   +-- prisma/
|   |   +-- schema.prisma    # Database schema
|   |   +-- migrations/      # Migration history
|   +-- docker-compose.yml
|
+-- frontend/
    +-- src/
        +-- app/
        |   +-- (auth)/      # Login, signup
        |   +-- (dashboard)/ # Wallet, market, portfolio
        +-- components/
        |   +-- ui/          # Button, card, input, dialog, toast
        |   +-- trading/     # PriceChart, TradeForm, OrderBook
        +-- hooks/           # useAuth, useWallet, useWebSocket
    +-- package.json
```

---

## Testing

```bash
# Backend
cd backend
npm test                   # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests

# Frontend
cd frontend
npm test                  # Run tests
npm run test:watch       # Watch mode
```

---

## Revenue Model

| Source | Mechanism | Status |
|--------|-----------|--------|
| **Deposit fee** | 1% on wallet top-up | Live |
| **Withdrawal fee** | Flat fee on bank transfer | Live |
| **Listing fee** | One-time athlete onboarding | Live |
| **Idle pool yield** | 80% of pool in T-bills, 20% liquid | Requires NBFC partner |

**Why fee at deposit?** The user always knows their exact balance. No surprise deductions. Transparency over friction.

---

## Roadmap

- [x] Bonding curve engine with Decimal.js
- [x] Variable pool ratio implementation
- [x] Per-athlete trade queues
- [x] Idempotency and race condition defense
- [x] Bot trading system (3 built-in strategies)
- [x] WebSocket real-time price updates
- [ ] Mobile app (React Native)
- [ ] User-configurable bot UI
- [ ] KYC integration (Aadhaar + PAN)
- [ ] Payment gateway integration (Razorpay/Paytm)
- [ ] NBFC partnership for idle pool investment
- [ ] Advanced analytics dashboard
- [ ] Portfolio rebalancing tools

---

## Documentation

- **API Reference:** `backend/docs/openapi.yaml`
- **Database Schema:** `backend/prisma/schema.prisma`
- **Design Document:** `backend/docs/SportsFolio_Design.pdf`
- **Architecture Diagrams:** `backend/docs/architecture/`

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
4. Push and open a Pull Request

**Code style:** ESLint + Prettier (configured in repository)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

Inspired by the real struggles of Ranji Trophy cricketers who deserve better funding mechanisms.

Built by developers who believe in democratizing athlete funding.

---

## Get In Touch

- **Issues:** [GitHub Issues](https://github.com/Crunchymon/SPORTS_FOLIO/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Crunchymon/SPORTS_FOLIO/discussions)
- **Email:** support@sportsfolio.in

---

**SportsFolio**: *Because every champion was once a believer's bet.*