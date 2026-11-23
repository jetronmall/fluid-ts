---
'@jetronticket/api': minor
---

Add add-ons. `listAddons` lists the add-ons on sale for an event, and `createReservation` takes `addons` next to tickets or on their own with `buyerEmail`, so `items` is now optional in `CreateReservationRequest`. Tickets list their `includedAddons`, reservations and orders list the `addons` bought, and tickets from `lookupAttendeeTickets` list the `addons` that came with them. `lookupAttendeeAddons` returns the add-ons an email bought, with their QR codes. It needs your private key and runs on your server only. `HealthChecks` now includes `ai`.
