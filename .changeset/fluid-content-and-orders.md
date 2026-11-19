---
'@jetronticket/api': minor
---

Add `getHost`, `listSponsors`, `listMoments`, `validatePromoCode` and `getOrder`. `getOrder` confirms an order on your callback page with the `reference` from the query string. Paid orders from `createOrder` now return their `reference` too.
