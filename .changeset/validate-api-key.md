---
'@jetronticket/api': patch
---

Throw a clear error when `createClient` is called without an `apiKey`, instead of silently sending `Authorization: Bearer undefined`.
