import { ApiError } from './errors'
import type {
  CreateOrderRequest,
  CreateReservationRequest,
  Event,
  EventList,
  Health,
  Order,
  Reservation,
  ReleaseResult,
  Ticket,
} from './types'

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

/**
 * Header initializer accepted by the platform `Headers` constructor. Derived
 * from the ambient `Headers` type so it works in browsers and Node.js without
 * pulling in the full DOM lib.
 */
export type HeadersInit = NonNullable<ConstructorParameters<typeof Headers>[0]>

/** The production Jetron Fluid API base URL. */
export const DEFAULT_BASE_URL = 'https://fluid.jetronticket.com/api/v1'

export interface JetronFluidClientOptions {
  /** Your public API key (e.g. `jt_public_...`), sent as a Bearer token. */
  apiKey: string
  /**
   * Override the API base URL. Defaults to the production Jetron Fluid API.
   * Reserved for advanced use (e.g. a future test environment); most
   * integrations should omit it.
   */
  baseUrl?: string
  /**
   * Custom fetch implementation. Defaults to the global `fetch`
   * (available in browsers and Node.js 18+).
   */
  fetch?: typeof fetch
  /** Extra headers merged into every request. */
  headers?: HeadersInit
}

/** Options common to every request. */
export interface RequestOptions {
  /** Abort the request via an AbortController's signal. */
  signal?: AbortSignal
  /** Extra headers for this single request (override client defaults). */
  headers?: HeadersInit
}

/** Options for conditional (ETag-cached) GET requests. */
export interface ConditionalRequestOptions extends RequestOptions {
  /** An `ETag` from a previous response. Yields a 304 (`notModified`) if unchanged. */
  ifNoneMatch?: string
}

export interface ListEventsParams extends ConditionalRequestOptions {
  /** Filter events by category slug. */
  category?: string
  /** Full-text search query. */
  q?: string
  /** Page size (1-100). Defaults to 20 server-side. */
  limit?: number
  /** Opaque pagination cursor returned as `nextCursor`. */
  cursor?: string
}

export interface ReservationOptions extends RequestOptions {
  /**
   * The `reservationToken` (a UUID) identifying the attendee's cart, sent as
   * `X-Device-ID`. Omit to start a new reservation; pass it to refresh one.
   */
  deviceId?: string
}

export interface ReleaseOptions extends RequestOptions {
  /**
   * The `reservationToken` to release, sent as `X-Device-ID`. If omitted, the
   * server releases the reservation held for your client IP + event.
   */
  deviceId?: string
}

export interface CreateOrderOptions extends RequestOptions {
  /**
   * The `reservationToken` from the reservation response, echoed as
   * `X-Device-ID`. Required.
   */
  deviceId: string
}

// ---------------------------------------------------------------------------
// Result envelope
// ---------------------------------------------------------------------------

/**
 * The result of a request. `data` holds the unwrapped payload; `data` is `null`
 * only when a conditional GET returns 304 (`notModified === true`).
 */
export interface ApiResult<T> {
  /** The unwrapped `data` payload, or `null` on a 304 Not Modified response. */
  data: T
  /** The HTTP status code. */
  status: number
  /** The response `ETag`, when present. Echo as `ifNoneMatch` to enable caching. */
  etag: string | null
  /** `true` when a conditional GET returned 304 Not Modified. */
  notModified: boolean
  /** The raw fetch Response, for advanced use. */
  response: Response
}

type QueryValue = string | number | undefined
type Query = Record<string, QueryValue>

interface RequestConfig {
  query?: Query
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  deviceId?: string
  ifNoneMatch?: string
  /** Whether to send the Authorization header. Defaults to true. */
  auth?: boolean
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface JetronFluidClient {
  /** Perform a raw request against the API. Powers the endpoint helpers below. */
  request<T>(method: string, path: string, config?: RequestConfig): Promise<ApiResult<T>>

  /** `GET /health` — readiness probe (unauthenticated). */
  health(options?: RequestOptions): Promise<ApiResult<Health>>

  /** `GET /events` — list the host's public events, newest first. */
  listEvents(params?: ListEventsParams): Promise<ApiResult<EventList | null>>

  /** `GET /events/{slug}` — fetch a single public event. */
  getEvent(slug: string, options?: ConditionalRequestOptions): Promise<ApiResult<Event | null>>

  /** `GET /events/{slug}/tickets` — list an event's purchasable ticket types. */
  listTickets(slug: string, options?: RequestOptions): Promise<ApiResult<Ticket[]>>

  /** `POST /events/{slug}/reservations` — price the cart and hold stock. */
  createReservation(
    slug: string,
    body: CreateReservationRequest,
    options?: ReservationOptions,
  ): Promise<ApiResult<Reservation>>

  /** `DELETE /events/{slug}/reservations` — release a held reservation. */
  releaseReservation(slug: string, options?: ReleaseOptions): Promise<ApiResult<ReleaseResult>>

  /** `POST /events/{slug}/orders` — complete checkout for a held reservation. */
  createOrder(
    slug: string,
    body: CreateOrderRequest,
    options: CreateOrderOptions,
  ): Promise<ApiResult<Order>>
}

function buildQuery(query?: Query): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Create a Jetron Fluid API client.
 *
 * @example
 * ```ts
 * const client = createClient({ apiKey: 'jt_public_...' })
 * const { data: events } = await client.listEvents({ limit: 20 })
 * ```
 */
export function createClient(options: JetronFluidClientOptions): JetronFluidClient {
  const { apiKey, headers: defaultHeaders } = options
  if (!apiKey) {
    throw new Error('createClient requires an `apiKey`.')
  }
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')

  const fetchImpl = options.fetch ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') {
    throw new Error(
      'No fetch implementation found. Pass `fetch` in the client options or run on a platform with a global fetch (browsers, Node.js 18+).',
    )
  }
  // Bind to avoid "Illegal invocation" when using the global fetch.
  const doFetch: typeof fetch = (input, init) => fetchImpl(input, init)

  async function request<T>(
    method: string,
    path: string,
    config: RequestConfig = {},
  ): Promise<ApiResult<T>> {
    const { query, body, signal, deviceId, ifNoneMatch, auth = true } = config

    const headers = new Headers(defaultHeaders)
    headers.set('Accept', 'application/json')
    if (auth) headers.set('Authorization', `Bearer ${apiKey}`)
    if (body !== undefined) headers.set('Content-Type', 'application/json')
    if (deviceId) headers.set('X-Device-ID', deviceId)
    if (ifNoneMatch) headers.set('If-None-Match', ifNoneMatch)
    if (config.headers) {
      for (const [key, value] of new Headers(config.headers)) headers.set(key, value)
    }

    const response = await doFetch(`${baseUrl}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })

    const etag = response.headers.get('ETag')

    if (response.status === 304) {
      return { data: null as T, status: 304, etag, notModified: true, response }
    }

    const text = await response.text()
    const json: unknown = text.length > 0 ? JSON.parse(text) : undefined

    if (!response.ok) {
      throw ApiError.fromResponse(response, json)
    }

    const data = (json as { data?: T } | undefined)?.data as T
    return { data, status: response.status, etag, notModified: false, response }
  }

  const encode = (slug: string) => encodeURIComponent(slug)

  return {
    request,

    health: (opts = {}) => request<Health>('GET', '/health', { auth: false, ...opts }),

    listEvents: (params = {}) => {
      const { category, q, limit, cursor, ifNoneMatch, ...rest } = params
      return request<EventList | null>('GET', '/events', {
        query: { category, q, limit, cursor },
        ifNoneMatch,
        ...rest,
      })
    },

    getEvent: (slug, opts = {}) => {
      const { ifNoneMatch, ...rest } = opts
      return request<Event | null>('GET', `/events/${encode(slug)}`, { ifNoneMatch, ...rest })
    },

    listTickets: (slug, opts = {}) =>
      request<Ticket[]>('GET', `/events/${encode(slug)}/tickets`, opts),

    createReservation: (slug, body, opts = {}) => {
      const { deviceId, ...rest } = opts
      return request<Reservation>('POST', `/events/${encode(slug)}/reservations`, {
        body,
        deviceId,
        ...rest,
      })
    },

    releaseReservation: (slug, opts = {}) => {
      const { deviceId, ...rest } = opts
      return request<ReleaseResult>('DELETE', `/events/${encode(slug)}/reservations`, {
        deviceId,
        ...rest,
      })
    },

    createOrder: (slug, body, opts) => {
      const { deviceId, ...rest } = opts
      return request<Order>('POST', `/events/${encode(slug)}/orders`, { body, deviceId, ...rest })
    },
  }
}
