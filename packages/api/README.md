# @jetronticket/api

TypeScript client for **Jetron Fluid**, the Jetron Ticket headless API. It wraps
the REST endpoints as typed functions using the platform `fetch`, so it runs in
browsers and in Node.js 20+ with no dependencies.

The client mirrors [`specs/openapi.yaml`](./specs/openapi.yaml).

## Install

```sh
npm install @jetronticket/api
```

## Quick start

```ts
import { createClient } from '@jetronticket/api'

const client = createClient({
  apiKey: 'jt_public_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
})

// Browse events (data is unwrapped from the response envelope)
const { data: events } = await client.listEvents({ limit: 20, q: 'jazz' })

// Checkout flow
const { data: reservation } = await client.createReservation('my-event', {
  items: [{ sku: 'ticket-type-uuid', quantity: 2 }],
})

const { data: order } = await client.createOrder(
  'my-event',
  {
    quoteReference: reservation.quoteReference,
    email: 'attendee@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    callbackUrl: 'https://your-site/checkout/callback',
  },
  { deviceId: reservation.reservationToken }, // sent as X-Device-ID
)

if (order.status === 'pending_payment') {
  window.location.href = order.checkoutUrl // open the payment link
}

// On your callbackUrl page, confirm the order with the `reference` from the query string.
// It returns 404 until payment is confirmed, which usually takes a few seconds.
const reference = new URL(window.location.href).searchParams.get('reference')!
const { data: confirmed } = await client.getOrder('my-event', reference)
```

## API

`createClient(options)` returns a client with one method per endpoint. Every
method resolves to an `ApiResult<T>`:

```ts
interface ApiResult<T> {
  data: T // unwrapped payload (null on a 304 Not Modified)
  status: number // HTTP status code
  etag: string | null // response ETag, when present
  notModified: boolean // true when a conditional GET returned 304
  response: Response // the raw fetch Response
}
```

| Method                                    | Endpoint                                             |
| ----------------------------------------- | ---------------------------------------------------- |
| `health()`                                | `GET /health` (unauthenticated)                      |
| `getHost(options?)`                       | `GET /host`                                          |
| `listEvents(params?)`                     | `GET /events`                                        |
| `getEvent(slug, options?)`                | `GET /events/{slug}`                                 |
| `getEventGallery(slug, options?)`         | `GET /events/{slug}/gallery`                         |
| `listSponsors(slug, options?)`            | `GET /events/{slug}/sponsors`                        |
| `listMoments(slug, params?)`              | `GET /events/{slug}/moments`                         |
| `listTickets(slug, options?)`             | `GET /events/{slug}/tickets`                         |
| `listAddons(slug, options?)`              | `GET /events/{slug}/addons`                          |
| `listSales(slug, options?)`               | `GET /events/{slug}/sales`                           |
| `verifySalePassword(slug, saleId, body)`  | `POST /events/{slug}/sales/{saleId}/verify-password` |
| `joinSaleWaitlist(slug, saleId, body)`    | `POST /events/{slug}/sales/{saleId}/waitlist`        |
| `validatePromoCode(slug, body, options?)` | `POST /events/{slug}/promo-codes/validate`           |
| `createReservation(slug, body, options?)` | `POST /events/{slug}/reservations`                   |
| `releaseReservation(slug, options?)`      | `DELETE /events/{slug}/reservations`                 |
| `createOrder(slug, body, options?)`       | `POST /events/{slug}/orders`                         |
| `getOrder(slug, reference, options?)`     | `GET /events/{slug}/orders/{reference}`              |
| `lookupAttendeeTickets(body, options?)`   | `POST /attendees/tickets/lookup` (private key)       |
| `lookupAttendeeAddons(body, options?)`    | `POST /attendees/addons/lookup` (private key)        |

### Client options

- `apiKey` (required) — your API key, sent as `Authorization: Bearer <key>`. Use the
  public key for every method except `lookupAttendeeTickets` and `lookupAttendeeAddons`,
  which need the private key. `createClient` throws if it gets a private key in a browser.
- `fetch` — a custom fetch implementation (defaults to the global `fetch`).
- `headers` — extra headers merged into every request.
- `deviceIdMode` — how `X-Device-ID` is filled in on checkout calls (see below).
- `baseUrl` — advanced/optional; defaults to the production Jetron Fluid API.

Per-request options accept `signal` (an `AbortSignal`) and `headers`.

### Device IDs (`X-Device-ID`)

Reservation, order and release calls carry an `X-Device-ID` that ties them to one
attendee. The client fills it in when you don't pass `deviceId`:

- **`'browser'`** (default in browsers): one ID per browser, kept in `localStorage`
  under `jetron_fluid_device_id` and reused on every checkout call.
- **`'per-reservation'`** (default everywhere else): each `createReservation` without
  a `deviceId` gets a new random ID, returned as `reservationToken`. Pass it as
  `deviceId` to refresh the reservation, create the order or release it. Omitting it
  on `createOrder` or `releaseReservation` throws.

A `deviceId` option, or an `X-Device-ID` you set in `headers`, always wins over the
automatic value. Use `'per-reservation'` on a server, where one client serves many
attendees. Automatic IDs need Web Crypto (`crypto.randomUUID`), available in browsers
and Node.js 20+.

### Sales

```ts
const { data: sales } = await client.listSales('my-event')
const presale = sales.items.find((sale) => sale.requiresPassword && sale.phase === 'ACTIVE')

if (presale) {
  await client.verifySalePassword('my-event', presale.id, { password: 'VIP2026' })
  await client.createReservation('my-event', {
    items: [{ sku: presale.ticketIds[0], quantity: 1 }],
    saleId: presale.id,
    salePassword: 'VIP2026',
  })
}

const upcoming = sales.items.find((sale) => sale.waitlistOpen)

if (upcoming) {
  await client.joinSaleWaitlist('my-event', upcoming.id, {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
  })
}
```

### Add-ons

Events can sell add-ons such as parking, merch or priority access. `listAddons` returns
them with a `status`: `AVAILABLE`, `SOLD_OUT`, `COMING_SOON` or `SALES_CLOSED`. Only
`AVAILABLE` add-ons can be bought. Send them as `addons` with a reservation, next to
tickets or on their own:

```ts
const { data: addons } = await client.listAddons('my-event')
const parking = addons.items.find((addon) => addon.status === 'AVAILABLE')!

// With tickets
await client.createReservation('my-event', {
  items: [{ sku: ticket.id, quantity: 2 }],
  addons: [{ addonId: parking.id, quantity: 1 }],
})

// On their own: the add-ons are delivered to buyerEmail
await client.createReservation('my-event', {
  addons: [{ addonId: parking.id, quantity: 1 }],
  buyerEmail: 'ada@example.com',
})
```

Every reservation call replaces the cart, so send `items` and `addons` each time. Anyone
can buy an add-on, unless its `ticketIds` lists tickets: then one of them must be in the
cart, or already be held by `buyerEmail` when the add-ons are bought on their own. Promo
codes discount tickets only and can't be sent with add-ons alone.

Add-ons that come with a ticket are on `ticket.includedAddons`. The buyer gets them
automatically, so don't send them in `addons`.

### Promo codes

`validatePromoCode` checks a code before the attendee reserves, so you can show the
discount early. Send the ticket IDs in the cart. It does not hold the code: pass it as
`promoCode` to `createReservation` to apply it.

```ts
const { data: promo } = await client.validatePromoCode('my-event', {
  code: 'EARLY10',
  ticketIds: [ticket.id],
})
// promo.type is 'PERCENTAGE' or 'FIXED'; promo.value is the discount
```

### Attendee tickets

`lookupAttendeeTickets` returns the tickets an email holds for your events, so attendees
who sign in to your own app can see their QR codes. It needs your **private** key, so
create a second client for it on your server, and only call it after your app has
verified that the signed-in user owns the email. Other methods reject the private key.

```ts
const fluidPrivate = createClient({ apiKey: process.env.JETRON_PRIVATE_API_KEY! })

const { data } = await fluidPrivate.lookupAttendeeTickets({
  email: session.user.email,
  used: false,
})

for (const order of data.items) {
  for (const ticket of order.tickets) {
    // ticket.qrCode is only set for VALID tickets
    // ticket.unlocksAt is set for LOCKED tickets
  }
}
```

When an event has Website & App Only turned on, its tickets stay locked until the event's
Ticket Release Time before each ticket's date (7 days unless the organizer changes it).
Until then the ticket comes back `LOCKED`, without a `qrCode`, and `unlocksAt` says when
the code becomes available. Fetch the tickets again after that time to get it. Refunded orders and invalidated tickets are left out, and tickets follow
transfers. Pass `data.nextCursor` as `cursor` for the next page. Don't cache the
response: scans change ticket status live.

### Attendee add-ons

Every add-on that is scanned has one QR code per unit. Add-ons that came with a ticket are
in `addons` on each ticket from `lookupAttendeeTickets`. Add-ons the attendee bought come
from `lookupAttendeeAddons`, which needs your private key and the same verified email:

```ts
const { data } = await fluidPrivate.lookupAttendeeAddons({ email: session.user.email })

for (const addon of data.items) {
  for (const { code, redeemedAt } of addon.codes) {
    // render `code` as a QR code; redeemedAt is set once that unit is collected
  }
}
```

`INSTRUCTIONS` add-ons have no codes: show `addon.instructions`. Refunded and cancelled
add-ons are left out. Don't cache the response: scans change codes live.

### Errors

Non-2xx responses throw an `ApiError` with the parsed error envelope:

```ts
import { ApiError } from '@jetronticket/api'

try {
  await client.getEvent('missing')
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.status, err.errorCode, err.message)
  }
}
```

### Conditional requests (ETag caching)

`getHost`, `listEvents`, `getEvent`, `getEventGallery`, `listSponsors` and `listMoments`
support conditional requests. Pass a previous
`etag` back as `ifNoneMatch`; a `304` resolves with `notModified: true` and
`data: null`, so you can keep using your cached value:

```ts
const first = await client.getEvent('my-event')
const next = await client.getEvent('my-event', { ifNoneMatch: first.etag ?? undefined })
if (next.notModified) {
  // nothing changed — reuse `first.data`
}
```

## Development

From the repo root:

- `pnpm --filter @jetronticket/api build`
- `pnpm --filter @jetronticket/api dev`
- `pnpm --filter @jetronticket/api typecheck`
