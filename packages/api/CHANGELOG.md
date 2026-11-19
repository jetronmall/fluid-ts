# @jetronticket/api

## 0.3.0

### Minor Changes

- 1edbe33: Add `getHost`, `listSponsors`, `listMoments`, `validatePromoCode` and `getOrder`. `getOrder` confirms an order on your callback page with the `reference` from the query string. Paid orders from `createOrder` now return their `reference` too.
- b333421: Add sales support: `listSales`, `verifySalePassword`, `joinSaleWaitlist`, a `saleId` option on `listTickets`, `saleId` and `salePassword` on `createReservation`, and the `sales` list on each ticket. The client now fills in `X-Device-ID` for you: in browsers it keeps one ID in `localStorage`, and elsewhere it creates one per reservation, so `createOrder` no longer needs `deviceId` in the browser. Also adds the `ALL_RESERVED` ticket status.

  An `X-Device-ID` passed through `headers` still takes precedence over the automatic value. Automatic device IDs use Web Crypto, so the supported runtime is now Node.js 20+ (Node.js 18 is end-of-life); on older runtimes pass `deviceId` yourself.

## 0.2.0

### Minor Changes

- 4653826: Introduced ability to fetch headliners and event gallery

## 0.1.2

### Patch Changes

- 0a8ddf3: License the SDK under MIT and include a LICENSE file in the published package.

## 0.1.1

### Patch Changes

- fef4127: Throw a clear error when `createClient` is called without an `apiKey`, instead of silently sending `Authorization: Bearer undefined`.

## 0.1.0

### Minor Changes

- First major release, exporting all major methods and types
