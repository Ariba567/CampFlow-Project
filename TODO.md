# Pricing & Booking Window Extension (through 2030)

## Requirement
Extend the pricing/booking active window so that a booking for 01/01/2027 (and later) works correctly, and ensure the holiday (incl. Easter) date list matches the extended window.

## Status
- [x] Diagnosed the 2027 booking failure (no pricing rule in the active window)
- [x] Seeded/updated pricing rules so the active window extends through 2030
- [x] Confirmed no remaining "unpriced" rules at 2026-12-31 (0 remain)
- [x] Verified the 01/01/2027 → 01/02/2027 RV booking: quote now returns **$63.80** (1 night @ $58 Regular + $5.80 tax)
- [x] Checked the Easter holiday list — this was still pending in `reservationService.ts`
- [x] Added Easter Sundays 2027–2030 (2027-03-28, 2028-04-16, 2029-04-01, 2030-04-21) to `HOLIDAY_DATES_ISO`
- [x] Extended New Year's Day and Christmas dates through 2030 in `HOLIDAY_DATES_ISO`
- [x] Cleaned up temporary verification scripts (`extendPricingEndDate.ts`, `verifyBooking2027.ts`, `queryRVEndDate.ts`)
- [x] TypeScript typecheck passes (no errors)

## Files changed
- `artifacts/api-server/src/services/reservationService.ts` — holiday date list extended to cover 2027–2030 (Easter, New Year's Day, Christmas)
- `artifacts/api-server/src/scripts/seedPricing.ts` — pricing rules window extended through 2030
