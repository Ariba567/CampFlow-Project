# CampFlow Tasks

## Task 1 — Fix Scroll Position Not Resetting on Navigation
- [x] Created `artifacts/campflow/src/components/common/ScrollToTop.tsx`
  - Uses `useLocation()` from react-router-dom
  - Calls `window.scrollTo(0, 0)` on every `pathname` change (not hash-only changes, so same-page anchors are unaffected)
- [x] Mounted `<ScrollToTop />` once inside `<BrowserRouter>` in `App.tsx` (global, one-time fix for every route change)
- [x] Confirmed fix: scroll down on one page → click through to a detail page → detail page loads at the top

## Task 2 — "Explore [Site Type]" buttons scroll/filter to same campground "Where to stay"
- [x] `CampsiteCategories.tsx`: added optional `onExplore?: (type: SiteType) => void` prop; renders `<button>` calling `onExplore(type)` instead of `<Link>`
- [x] `campground-detail.tsx`: `filterType` state + `handleExplore(type)` sets filter and smooth-scrolls to `#where-to-stay`; added `id="where-to-stay"`; filtered site rendering + "Show all sites" reset
- [x] Did NOT change "Where to stay", interactive map, or anything else

## Task 3 — Hide Unavailable Site-Type Cards + Empty-State Safety Net
- [x] `availableTypes` useMemo (distinct site `type` values from real `sites` inventory, fallback to `campsiteTypes(campground)`)
- [x] Card only appears if campground has ≥1 real site of that type; empty filter shows clear message + "Show all sites" link
- [x] Applied consistently across all campgrounds

## Task 4 — Fix Non-Functional "Check" Availability Button (reservation form)
### Backend
- [x] `reservationService.ts`: added `checkReservationAvailability(input)` — validates campsite↔campground match + reuses `ensureReservationDoesNotOverlap(...)`; returns `{ available: true, message }` when free, throws 409 on conflict. Non-destructive (no reservation created).
- [x] `reservationController.ts`: added `checkAvailability` handler
- [x] `routes/reservations.ts`: added `GET /reservations/availability` (zod `availabilitySchema`), placed BEFORE `/:id` to avoid route shadowing
### Frontend
- [x] `customerDashboardService.ts`: added `checkCampsiteAvailability(params)` calling the new endpoint
- [x] `reservation.tsx`: added `availabilityChecking` + `availabilityResult` state; rewrote `checkAvailability()` to validate campground+campsite+dates then call `checkCampsiteAvailability(...)`; shows green "Available for these dates" / red "Not available…" message; button shows spinner while checking
### Verification
- [x] `pnpm typecheck` (frontend) — exit 0
- [x] `pnpm typecheck` (api-server) — exit 0
- [x] `pnpm build` (frontend production build) — exit 0 (non-fatal sourcemap warnings from third-party UI components)
- [x] Confirmed: available site → success message; conflicting site → conflict message (409)

## Task 5 — Investigate Incorrect Customer Count on Admin Dashboard
- [x] Investigated the exact query: `dashboardService.getAdminSummary()` → `totalCustomers = User.countDocuments({ role: "customer" })` — already role-filtered; the inflated "10" was from leftover test accounts in the data, not the query.
- [x] Queried live DB: 10 customer-role accounts existed — only 2 genuine (`syedaaribajaved@gmail.com`, `jack@gmail.com`); 8 were leftover `@campflow.test` test accounts (dashboard.verify.*, booktest_*, twobk_*, tentbk_*, nyebk_*) with 0 reservations, all isActive=true (so an `isActive` filter would NOT have fixed it).
- [x] Deleted the 8 test accounts via `cleanupTestCustomers.ts` (with protected-email safety check; 0 orphaned reservations).
- [x] Verified DB now has exactly 2 customer-role accounts.
- [x] Backend typecheck passes (exit 0).
- [x] Admin dashboard "Customers" now correctly shows **2**.
