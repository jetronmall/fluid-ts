---
'@jetronticket/api': minor
---

Add `lookupAttendeeTickets`, which returns the tickets an email holds for your events so attendees can see their QR codes in your own app. It needs your private key and runs on your server only. `createClient` now throws when given a private key in a browser.
