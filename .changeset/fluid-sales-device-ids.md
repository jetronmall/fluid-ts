---
'@jetronticket/api': minor
---

Add sales support: `listSales`, `verifySalePassword`, `joinSaleWaitlist`, a `saleId` option on `listTickets`, `saleId` and `salePassword` on `createReservation`, and the `sales` list on each ticket. The client now fills in `X-Device-ID` for you: in browsers it keeps one ID in `localStorage`, and elsewhere it creates one per reservation, so `createOrder` no longer needs `deviceId` in the browser. Also adds the `ALL_RESERVED` ticket status.

An `X-Device-ID` passed through `headers` still takes precedence over the automatic value. Automatic device IDs use Web Crypto, so the supported runtime is now Node.js 20+ (Node.js 18 is end-of-life); on older runtimes pass `deviceId` yourself.
