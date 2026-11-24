---
'@jetronticket/api': minor
---

`AddonStatus` gains `COMING_SOON` and `SALES_CLOSED`. `listAddons` now also returns add-ons whose sales have closed, so check that `status` is `AVAILABLE` before you offer one.
