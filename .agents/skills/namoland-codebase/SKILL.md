---
name: Namoland Codebase Reference
description: Complete reference for the Namoland Library Platform codebase — all models, server actions, services, pages, components, and business logic patterns.
---

# Namoland Library Platform — Complete Codebase Reference

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, TailwindCSS 4 |
| i18n | next-intl (th/en, 1104 keys, `messages/th.json` + `messages/en.json`) |
| Database | PostgreSQL via Prisma 7.4.2 (`@prisma/adapter-pg`) |
| Auth | NextAuth v5 (beta.30) with JWT strategy |
| Icons | lucide-react |
| Charts | recharts |
| QR Code | html5-qrcode (scanner), qrcode.react (generator) |
| Excel | xlsx, xlsx-js-style |
| Password | bcryptjs |
| Date | date-fns |
| Deploy | Docker + docker-compose |

## Project Structure

```
src/
├── actions/          # 14 server action files (~90 exported functions)
├── app/[locale]/     # i18n-wrapped routes (th/en)
│   ├── (admin)/      # Admin dashboard (21 pages, protected by middleware)
│   ├── (user)/       # User portal (11 pages)
│   ├── _components/  # Landing page components
│   ├── book/         # Public book detail via QR
│   └── login/        # Admin login
├── app/api/          # 3 API routes (outside locale)
├── components/
│   ├── admin/        # Sidebar.tsx
│   └── ui/           # AlertMessage, BackLink, Card, DateInput, Modal, PageHeader, StatusBadge
├── lib/              # 6 service files
├── types/            # next-auth.d.ts
├── i18n/             # next-intl config (routing, request)
└── middleware.ts     # Route protection + i18n routing
messages/
├── th.json           # Thai translations (1104 keys)
└── en.json           # English translations (1104 keys)
prisma/
├── schema.prisma     # 15 models, 5 enums, 15 custom indexes
└── seed.ts           # Database seeder
```

---

## Database Schema (15 Models)

### Core Models

| Model | Key Fields | Purpose |
|---|---|---|
| `User` | parentName, phone (unique), password?, qrCode (unique), lineUserId?, coinExpiryOverride? | Library member (parent) |
| `Child` | name, birthDate, userId → User | Children of a member |
| `AdminUser` | name, email (unique), password, role (ADMIN/SUPER_ADMIN) | Admin staff |
| `Book` | title, qrCode (unique), isbn?, category?, ageRange?, youtubeUrl?, rentalCost (default 1), isAvailable, isActive | Library book catalog |

### Borrow System

| Model | Key Fields | Purpose |
|---|---|---|
| `BorrowRecord` | code (unique, BOR-YYYYMM-NNNN), userId, status (RESERVED/BORROWED/RETURNED/OVERDUE/FORFEITED/CANCELLED), borrowDate, dueDate, returnDate?, depositCoins, rentalCoins, lateFeeCoins, damageFeeCoins, depositReturned, depositForfeited, processedById, returnedById | Tracks book borrowing lifecycle |
| `BorrowItem` | borrowRecordId, bookId, isDamaged, damageNote?, returned, returnedAt? | Individual book in a borrow record |

### Coin Economy

| Model | Key Fields | Purpose |
|---|---|---|
| `CoinPackage` | userId, packageType, totalCoins, remainingCoins, pricePaid, bonusAmount, firstUsedAt?, expiresAt?, isExpired, isExtended, paymentMethod?, purchaseDate | Coin package with FIFO deduction |
| `CoinTransaction` | packageId, type (enum), coinsUsed, className?, classHours?, description?, borrowRecordId?, processedById | Transaction log per coin usage |
| `TopUpRequest` | userId, packageType, coins, amount, status (PENDING/APPROVED/REJECTED), slipNote?, adminNote?, processedById | Self-service top-up requests |
| `ExpiryLog` | userId, previousDate?, newDate, note?, performedBy | Audit trail for expiry extension |

### Class System

| Model | Key Fields | Purpose |
|---|---|---|
| `ClassSchedule` | title?, theme?, startDate, endDate | Weekly schedule container |
| `ClassEntry` | scheduleId, teacherId?, dayOfWeek, startTime, endTime, title, sortOrder | Individual class slot |
| `ClassBooking` | classEntryId, userId, childId?, coinsCharged, status (BOOKED/CHECKED_IN/CANCELLED/NO_SHOW), bookedById, checkedInAt? | Class booking record |
| `Teacher` | name, nickname?, color?, isActive, sortOrder | Teacher/instructor |

### Config & Settings

| Model | Key Fields | Purpose |
|---|---|---|
| `PackageConfig` | key (unique), label, coins, price, bonus, sortOrder, isActive | Configurable coin packages |
| `ActivityConfig` | name, description?, icon?, iconImageUrl?, coins, sortOrder, isActive, showOnLanding | Activity types with pricing |
| `ShopInfo` | shopName, bankName?, accountNumber?, accountName?, note?, scheduleImageUrl?, weeklyScheduleImageUrl?, heroImageUrl? | Shop settings (singleton) |

### Enums

- `AdminRole`: ADMIN, SUPER_ADMIN
- `BorrowStatus`: RESERVED, BORROWED, RETURNED, OVERDUE, FORFEITED, CANCELLED
- `CoinTransactionType`: CLASS_FEE, BOOK_RENTAL, BOOK_DEPOSIT, BOOK_DEPOSIT_RETURN, BOOK_LATE_FEE, BOOK_DAMAGE_FEE, DEPOSIT_FORFEIT, EXPIRED, ADJUSTMENT, EXTENSION
- `TopUpStatus`: PENDING, APPROVED, REJECTED
- `BookingStatus`: BOOKED, CHECKED_IN, CANCELLED, NO_SHOW

---

## Lib Services (src/lib/)

### auth.ts
- Dual credential providers: `admin-login` (email+password → AdminUser) and `user-login` (phone+password → User)
- JWT strategy, custom callbacks attach `id`, `role`, `type` to session
- Login page: `/login`

### prisma.ts
- PrismaClient with `@prisma/adapter-pg` (Pool-based connection)
- Singleton pattern for dev environment
- Debug logging in development

### constants.ts
- `BORROW_DEPOSIT_COINS = 5`, `BORROW_RENTAL_COINS = 1`, `BORROW_DURATION_DAYS = 14`, `DAMAGE_FEE_PER_BOOK = 1`
- `LATE_FEE_TIERS`: GRACE_DAYS=5, TIER1(6-15d)=1coin, TIER2(16-30d)=2coins, >30d=forfeit deposit
- `BORROW_STATUS_MAP`, `COIN_TX_TYPE_MAP` — Thai label + CSS class maps

### utils.ts
- `calculateLateFee(dueDate, returnDate)` → `{ lateDays, feeCoins, forfeitDeposit }`

### borrow-service.ts
- `generateBorrowCode()` → `BOR-YYYYMM-NNNN` (race-condition safe via findFirst + orderBy desc)
- `hasActiveDeposit(userId)` → boolean
- `getUsersWithActiveDeposit(userIds)` → Set<string> (batch check)

### coin-service.ts — **Central FIFO Engine**
- `prepareFIFODeduction(userId, coinsNeeded)` → plans deduction from oldest packages
- `buildPackageDeductOps(deductions, now)` → Prisma update ops (includes expiry clock start on first use)
- `buildTransactionOps(deductions, type, processedById, opts?)` → CoinTransaction create ops
- `syncCoinExpiryOverride(userId, deductions, now)` → updates user.coinExpiryOverride if new clock started

---

## Server Actions (src/actions/)

### borrow.ts (755 lines) — Book CRUD + Borrow Lifecycle

| Function | Auth | Purpose |
|---|---|---|
| `createBook(formData)` | - | Create book with auto QR (BOOK-XXXX) |
| `getBookById(id)` | - | Book detail with borrow history |
| `updateBook(id, formData)` | - | Update book fields |
| `deleteBook(id)` | - | Delete book (checks active borrows) |
| `getBooks(search?, status?)` | - | List with search + filter (inactive/available/borrowed) |
| `getBookByQrCode(qrCode)` | - | Find book by QR with current borrow info |
| `getBookByQrCodePublic(qrCode)` | - | Public book lookup (limited fields) |
| `createBorrow(formData)` | Admin | Full borrow: validates coins, FIFO deduction for deposit+rental, marks books unavailable |
| `returnBooks(formData)` | Auth | Return books: late fee calc, damage fee, deposit refund (shared deposit logic), supports partial returns |
| `getBorrows(params?)` | - | List borrows with search + date range |
| `reserveBook(bookId)` | User | User self-reserve: deducts rental only, no deposit |
| `confirmReservation(borrowId)` | Admin | Confirm reservation → BORROWED, charge deposit if needed |
| `cancelReservation(borrowId)` | Auth | Cancel reservation: refund rental coins, release books |
| `rejectReservation(borrowId)` | Admin | Admin reject = cancelReservation |
| `getUsersWithActiveDeposit(userIds)` | - | Wrapper for borrow-service function |

**Key Business Rules:**
- Max 5 books per borrow
- Shared deposit: only 1 deposit per user across all active borrows
- Partial returns supported (returnItemIds)
- On full return: deposit returned to earliest active package, cascading depositReturned to zero-deposit records
- Forfeit deposit if >30 days late

### coin.ts (446 lines) — Coin Packages + Top-Up

| Function | Auth | Purpose |
|---|---|---|
| `purchasePackage(formData)` | Auth | Admin adds coins for member (supports CUSTOM type + backdated purchase) |
| `spendCoins(formData)` | Auth | Manual coin spend (CLASS_FEE type) |
| `getExpiringPackages()` | - | Packages expiring within 7 days |
| `extendExpiry(formData)` | Admin | Set member-level coinExpiryOverride + create ExpiryLog |
| `deductCoins(formData)` | Admin | Manual FIFO deduction (ADJUSTMENT type) |
| `adjustCoinsUp(formData)` | Admin | Add coins to oldest active package or create new ADJUSTMENT package |
| `createTopUpRequest(packageType, slipNote?)` | User | User self-service top-up request |
| `getUserTopUpRequests()` | Auth | User's own top-up history |
| `getPendingTopUps()` | - | All pending top-up requests |
| `getAllTopUps()` | - | All top-up requests |
| `getTopUpsByUser(userId)` | - | Top-ups for specific user |
| `processTopUp(requestId, action, adminNote?)` | Admin | Approve (creates coin package) or reject top-up |

**Key Business Rules:**
- FIFO: always deduct from oldest package first
- Expiry clock starts on FIRST USE of a package (1 month from first use)
- adjustCoinsUp uses negative coinsUsed in transactions
- Coin packages never directly deleted — isExpired flag used

### member.ts (311 lines) — Member CRUD

| Function | Auth | Purpose |
|---|---|---|
| `createMember(formData)` | - | Create member with auto QR (NML-XXXX), default password = last 4 digits of phone |
| `getMembers(search?)` | - | List with search (name, phone, children) |
| `searchMembers(query)` | - | Lightweight member search (top 10) |
| `getMemberById(id)` | - | Full member detail (children, packages, borrows, expiryLogs) |
| `getMemberByQrCode(qrCode)` | - | Member by QR (active packages + current borrows) |
| `updateMember(formData)` | - | Update member + manage children (create/update/delete in transaction) |
| `resetMemberPassword(id)` | - | Reset to last 4 digits of phone |
| `updateSelfProfile(formData)` | User | User self-edit profile |
| `changeSelfPassword(formData)` | User | User change password |

### classBooking.ts (263 lines) — Class Booking System

| Function | Auth | Purpose |
|---|---|---|
| `searchMembersForBooking(query)` | - | Member search with children + coin packages |
| `bookClassForMember(formData)` | Auth | Book class (NO coin deduction at booking time) |
| `checkInBooking(bookingId)` | Auth | Check-in with FIFO coin deduction (looks up ActivityConfig for pricing) |
| `cancelBooking(bookingId)` | Auth | Cancel (no refund needed — coins not yet deducted) |
| `markNoShow(bookingId)` | Auth | Mark as NO_SHOW |
| `getBookingsByEntry(entryId)` | - | Bookings for a class entry |
| `getBookingsForUser(userId)` | - | User portal booking history |

**Key: `findActivityConfig(classTitle)` — 3-tier matching: exact → contains → reverse-contains**

### refundCheckIn.ts — Cancellation and Auto-Refunds
| Function | Auth | Purpose |
|---|---|---|
| `cancelAndRefundCheckIn(recordId, isManual)` | Admin | Erases an incorrectly keyed Check-In `CoinTransaction` entirely, safely incrementing the exact deducted coins back into their *original* FIFO packages (`remainingCoins += coinsUsed`). Supports both Native Bookings and Manual Drop-ins (including FIFO-split bounds). Preserves reporting accuracy by acting as a strict delete rather than an "Adjustment". |

### classSchedule.ts (206 lines) — Schedule CRUD

| Function | Auth | Purpose |
|---|---|---|
| `getClassSchedules()` | - | List all with entry count |
| `getClassSchedulesWithEntries()` | - | Full schedule with entries + teacher info |
| `getClassScheduleById(id)` | - | Single schedule with entries |
| `createClassSchedule(formData)` | Admin | Create week (auto-adjusts to Monday) |
| `updateClassSchedule(formData)` | Admin | Update theme |
| `deleteClassSchedule(id)` | Admin | Delete (cascade entries+bookings) |
| `addClassEntry(formData)` | Admin | Add class entry to schedule |
| `updateClassEntry(formData)` | Admin | Update class entry |
| `deleteClassEntry(id)` | Admin | Delete class entry |
| `duplicateSchedule(id)` | Admin | Clone schedule to next week |

### report.ts (535 lines) — Reports

| Function | Purpose |
|---|---|
| `getOutstandingCoinReport(year)` | Yearly coin balance report: Uses Exact Package Snapshot Method (calculates true remaining ratio of unspent packages per month) instead of global WAC to prevent monetary drift. |
| `getClassAttendanceReport(dateFrom, dateTo, status?, search?)` | Class attendance with status summary |
| `getMemberReport(userId)` | Per-member coin timeline (Simulates a **Global FIFO Cost Allocation** chronologically across all transactions, bypassing incorrect DB bindings from historical bugs) |

### dashboard.ts (320 lines)

| Function | Purpose |
|---|---|
| `getOwnerDashboardData()` | Full owner dashboard: KPI cards (today/yesterday/month revenue+cash), 30-day revenue trend, business alerts (overdue, expiring, dead stock, low coins), top books, customer insights, financial summary |

### Other Action Files

| File | Functions | Purpose |
|---|---|---|
| `admin.ts` (120 lines) | `getAdminUsers`, `createAdminUser`, `updateAdminUser`, `deleteAdminUser` | Admin user CRUD (bcrypt passwords, self-delete prevention) |
| `shop.ts` (92 lines) | `getShopInfo`, `updateShopInfo`, `updateScheduleImage`, `removeScheduleImage` | Shop settings (singleton pattern) |
| `register.ts` (61 lines) | `registerUser` | Public user self-registration |
| `packageConfig.ts` (126 lines) | `getActivePackages`, `getAllPackageConfigs`, `getPackageByKey`, `createPackageConfig`, `updatePackageConfig`, `togglePackageActive`, `deletePackageConfig`, `seedPackageConfigs` | Coin package configuration CRUD |
| `activityConfig.ts` (160 lines) | `getActiveActivities`, `getActivitiesForLanding`, `getAllActivityConfigs`, `createActivityConfig`, `updateActivityConfig`, `toggleActivityActive`, `toggleShowOnLanding`, `updateActivityIcon`, `deleteActivityConfig`, `seedActivityConfigs` | Activity type configuration CRUD |
| `book-search.ts` (32 lines) | `searchBooks(search, skip)` | Public paginated book search (PAGE_SIZE=12) |

---

## App Routes

### Admin Routes — `(admin)/` group
Protected by middleware (requires ADMIN session).

| Route | Purpose |
|---|---|
| `/dashboard` | Owner analytics dashboard |
| `/owner` | Owner dashboard (alternate) |
| `/members` | Member list |
| `/members/new` | Add member |
| `/members/[id]` | Member detail (coins, borrows, children, expiry) |
| `/coins` | Coin management overview |
| `/coins/packages` | Package configuration |
| `/coins/top-ups` | Top-up request management |
| `/books` | Book catalog |
| `/books/new` | Add book |
| `/books/[id]` | Book detail + borrow history |
| `/borrows` | Borrow list |
| `/borrows/new/[userId]` | Create borrow for member |
| `/borrows/[id]` | Borrow detail |
| `/borrows/scan` | QR scanner for borrow operations |
| `/classes` | Class schedule list |
| `/classes/[id]` | Schedule detail + booking management |
| `/activities` | Activity configuration |
| `/reports` | Reports hub |
| `/settings` | Shop settings, teachers |
| `/settings/users` | Admin user management |

### User Routes — `(user)/user/` group

| Route | Purpose |
|---|---|
| `/user` | User dashboard |
| `/user/profile` | Edit profile + children |
| `/user/qr` | View personal QR code |
| `/user/coins` | Coin balance + history |
| `/user/coins/top-up` | Submit top-up request |
| `/user/books` | Browse book catalog |
| `/user/books/[id]` | Book detail + reserve |
| `/user/borrows` | Borrow history |
| `/user/classes` | Class booking history |
| `/user/youtube` | YouTube book videos |

### Public Routes

| Route | Purpose |
|---|---|
| `/` | Landing page (dynamic hero image from ShopInfo, schedule + activities) |
| `/login` | Admin login |
| `/user/login` | User login |
| `/user/register` | User registration |
| `/book/[qrCode]` | Public book detail via QR scan |
| `/youtube` | Public YouTube books |

### API Routes

| Route | Purpose |
|---|---|
| `/api/auth/[...nextauth]` | NextAuth handler |
| `/api/members/[id]/bookings` | Member bookings API |
| `/api/upload` | File upload endpoint (types: monthly, weekly, heroImage, activityIcon, bookCover) |

---

## UI Components (src/components/)

### Admin
- `Sidebar.tsx` — Admin sidebar navigation (7208 bytes)

### Shared UI
- `AlertMessage.tsx` — Success/error alert display
- `BackLink.tsx` — Back navigation link
- `Card.tsx` — Reusable card container
- `DateInput.tsx` — Date picker input (4563 bytes)
- `Modal.tsx` — Modal dialog (4320 bytes)
- `PageHeader.tsx` — Page title header
- `StatusBadge.tsx` — Status badge with color

### Landing Components (src/app/_components/)
- `LandingActivities.tsx` — Activity cards for landing page (8292 bytes)
- `LandingSchedule.tsx` — Weekly schedule display for landing page (13178 bytes)

---

## Middleware (src/middleware.ts)

- Forces Node.js runtime
- Protected admin routes: `/dashboard`, `/members`, `/coins`, `/books`, `/borrows`, `/activities`, `/classes`, `/reports`, `/settings`, `/owner`
- SUPER_ADMIN restriction: `/reports/revenue`
- Redirect to `/login` for unauthorized admin access

---

## Key Business Logic Patterns

### True FIFO Coin Deduction Pattern
All coin-consuming operations and refunds use the shared `coin-service.ts` heavily governed by `purchaseDate` ordering instead of `createdAt` to support backdated administration:
1. `prepareFIFODeduction(userId, coinsNeeded)` — plan usage starting from packages with the oldest `purchaseDate`
2. `buildPackageDeductOps(deductions, now)` — build Prisma update ops
3. `buildTransactionOps(deductions, type, processedById)` — build transaction logs
4. Execute in `prisma.$transaction([...ops])`
5. Refund operations (`returnBooks`, `cancelReservation`) MUST explicitly sort eligible packages by `purchaseDate` ascending to correctly restore coins to the absolute oldest package first.

### Global FIFO Reporting Simulation
Due to early bugs where transactions were occasionally bound to incorrect packages, report engines (`getMemberReport`) do not trust the DB's `Transaction -> Package` relationship to calculate per-coin resource cost. Instead, they build a **Cost Pool** from all packages sorted by `purchaseDate`, map all timeline events chronologically, and simulate consumption to output true FIFO cost per resource.

### Exact Snapshot Reporting Method (Outstanding Coins)
To prevent mathematical drift from Weighted Average Cost (WAC) calculations over time, reporting engine (`report.ts`) dynamically calculates exact unspent coin ratios from the database for each individual package at the end-of-month snapshot timestamp.
- **Why**: FIFO consumption means packages have non-linear depletion vectors.
- **How**: `Amount = sum((pkg.remaining / pkg.total) * pkg.pricePaid)` iterated over all historically active packages up to the cutoff date.

### Shared Deposit Logic
- One deposit covers all active borrows for a user
- `hasActiveDeposit(userId)` checks for any BORROWED record with unreturned deposit
- Deposit refunded only when LAST borrow is returned
- Deposit forfeit if >30 days overdue

### Class Booking Flow
1. **Book** → no coin deduction, just a reservation
2. **Check-in** → FIFO coin deduction using ActivityConfig pricing. The transaction and package expiry dates are strictly backdated to the **exact computed class date** (Monday startDate + dayOfWeek offset), ignoring the real-time check-in click timestamp.
3. **Cancel/No-show** → no refund needed
4. **Unified History View** → The `MemberBookingHistory` (Admin) and `/user/classes` (User) APIs fetch and merge both native `ClassBooking` entries and manual Drop-in `CoinTransaction` (type: `CLASS_FEE` without standard class prefixes) records. Expected missing fields (e.g., `childName`, `dayOfWeek`) on manual activities are pseudo-mapped. Crucially, the UI and API natively compute and expose the precise `classDate` for sorting and rendering, instead of relying on the `createdAt` timestamp, ensuring accuracy for advance bookings.

### Timezone Safety & Absolute Midnight Handling
The platform runs on UTC servers but operates in the Bangkok timezone (UTC+7). To prevent date-shifting defects during exact-date mapping (e.g., backend calculations vs frontend reports):
- Computed UTC times temporally shift bounds to UTC+7 (`classDate.setUTCHours(classDate.getUTCHours() + 7)`), manipulate days/hours, and shift back to UTC.
- This explicit pattern is used during `checkInBooking`, Booking history APIs, and transaction reports.

### Borrow Code Generation
- Pattern: `BOR-YYYYMM-NNNN`
- Race-condition safe: uses `findFirst({ orderBy: { code: "desc" } })` instead of count

### Authentication
- Dual providers: admin-login (email), user-login (phone)
- Session carries: id, role, type (ADMIN/USER)
- Default user password: last 4 digits of phone number

---

## Common Patterns & Conventions

1. **Server Actions** — All in `src/actions/`, use `"use server"` directive
2. **revalidatePath & router.refresh()** — Server-side path revalidation and client-side soft refreshes following Server Actions.
3. **Event-driven Client Sync** — Sibling stateful Client Components (like Reports grids or History tables) bypass `router.refresh()`. Instead, Server Action success handlers dispatch custom window events (`window.dispatchEvent(new Event('refresh-member-data'))`) triggering local `useEffect` fetches.
4. **Error Handling** — Return `{ error: "message" }` or `{ success: true }`
5. **bcrypt** — Dynamic import for ESM/CJS compatibility: `const bcryptModule = await import("bcryptjs")`
6. **FormData** — All create/update actions accept FormData
7. **Prisma Transactions** — `prisma.$transaction([...ops])` for multi-step operations
7. **QR Codes** — Auto-generated: `NML-XXXX` (members), `BOOK-XXXX` (books), `USR-XXXX` (self-registered)

---

## i18n (Internationalization)

- **Library**: `next-intl` with file-based routing (`src/i18n/routing.ts`)
- **Supported locales**: `th` (default), `en`
- **Translation files**: `messages/th.json`, `messages/en.json` (1104 keys each, must stay in sync)
- **Namespaces**: `Common`, `Landing`, `AdminMembers`, `AdminBooks`, `AdminBorrows`, `AdminClasses`, `AdminCoins`, `AdminDashboard`, `AdminSettings`, `AdminReports`, `UserDashboard`, `UserBooks`, `UserBorrows`, `UserCoins`, `UserClasses`, etc.
- **Client components**: Use `useTranslations("Namespace")` + `useLocale()`
- **Server components**: Use `getTranslations("Namespace")`
- **Date formatting**: Use `date-fns` locale — `const dateLocale = locale === "en" ? enUS : th`
- **AlertMessage success detection**: Check both `message.includes("สำเร็จ") || message.includes("success")`
- **Server action errors**: Still hardcoded Thai (technical debt — requires locale pass-through)

---

## Performance Optimizations

### Database Indexes (15 custom `@@index` entries)
- `User`: `[phone]`, `[qrCode]`
- `BorrowRecord`: `[userId]`, `[status]`, `[code]`
- `CoinPackage`: `[userId]`, `[isExpired, remainingCoins]`
- `CoinTransaction`: `[packageId]`
- `ClassBooking`: `[classEntryId]`, `[userId]`
- `TopUpRequest`: `[userId]`, `[status]`
- `Book`: `[qrCode]`, `[isActive, isAvailable]`

### Query Optimizations
- **Pagination**: `getBorrows` uses database-level `skip`/`take` instead of in-memory `slice`
- **Take limits**: `getMembers`, `getMemberById`, `getBooks`, `getAllTopUps` have `take` limits
- **DB-level filtering**: Book status filtering uses Prisma `where` clauses (not JS `.filter()`)
- **Parallelization**: Admin Dashboard + User Home use `Promise.all` for concurrent data fetching

---

## Deployment Workflow

The project uses custom bash scripts (`deploy-prod.sh`) for remote deployment.
1. Deploy to central production server by running `bash deploy-prod.sh`.
2. The script connects to the remote server via SSH, pulls the latest `main` branch, re-applies the `uploads` directory ownership (`1001:1001`), and executes `docker compose -f docker-compose.prod.yml build --no-cache && docker compose up -d`.
3. Caddy has been removed from the individual service level in favor of a central reverse proxy on the host server. The app runs mapped to port `3008` externally.
