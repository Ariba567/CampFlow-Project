# Task Progress: UI-Only Payment & Notification Features

## STEP 0 — Investigation (COMPLETE)
- [x] Read reservation.tsx — "Stay details" page with "Confirm reservation" button
- [x] Found notification system: localStorage-based via addUiNotification/listUiNotifications in customerDashboardService.ts
- [x] Found notification type enum: 'booking_confirmation' | 'booking_cancellation' | 'payment_confirmation'
- [x] Found where "Booking confirmed" notification is created: reservation.tsx submit() function, after createReservation succeeds
- [x] Found where "Reservation cancelled" notification is created: dashboard-bookings.tsx confirmCancel()
- [x] Found where "Payment confirmed" notification is created: dashboard.tsx useEffect, from payments data
- [x] Found Notifications feed UI: dashboard.tsx Notifications card

## Implementation
- [ ] 1. Add 'reminder' to UiNotification type in customerDashboardService.ts
- [ ] 2. Add Payment section to reservation.tsx (card fields + validation)
- [ ] 3. Add payment_confirmation notification in reservation.tsx submit()
- [ ] 4. Add reminder notifications in dashboard.tsx (upcoming stays within 3 days)
- [ ] 5. Update Notifications feed UI in dashboard.tsx with type-specific icons/labels
- [ ] 6. Run typecheck and production build, confirm both pass
