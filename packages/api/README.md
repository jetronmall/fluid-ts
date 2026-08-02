# @jetronticket/api

TypeScript client for **Jetron Fluid**, the Jetron Ticket headless API. It wraps
the REST endpoints as typed functions using the platform `fetch`, so it runs in
browsers and in Node.js 18+ with no dependencies.

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
  { deviceId: reservation.reservationToken }, // echoed as X-Device-ID
)

if (order.status === 'pending_payment') {
  window.location.href = order.checkoutUrl // redirect to the payment gateway
}
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

| Method                                    | Endpoint                             |
| ----------------------------------------- | ------------------------------------ |
| `health()`                                | `GET /health` (unauthenticated)      |
| `listEvents(params?)`                     | `GET /events`                        |
| `getEvent(slug, options?)`                | `GET /events/{slug}`                 |
| `listTickets(slug, options?)`             | `GET /events/{slug}/tickets`         |
| `createReservation(slug, body, options?)` | `POST /events/{slug}/reservations`   |
| `releaseReservation(slug, options?)`      | `DELETE /events/{slug}/reservations` |
| `createOrder(slug, body, options)`        | `POST /events/{slug}/orders`         |

### Client options

- `apiKey` (required) — your public key, sent as `Authorization: Bearer <key>`.
- `fetch` — a custom fetch implementation (defaults to the global `fetch`).
- `headers` — extra headers merged into every request.
- `baseUrl` — advanced/optional; defaults to the production Jetron Fluid API.

Per-request options accept `signal` (an `AbortSignal`) and `headers`.

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

`listEvents` and `getEvent` support conditional requests. Pass a previous
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
