import { ApiError } from './errors'
import type {
  CreateOrderRequest,
  CreateReservationRequest,
  Event,
  EventGallery,
  EventList,
  Health,
  JoinSaleWaitlistRequest,
  JoinSaleWaitlistResult,
  Order,
  Reservation,
  ReleaseResult,
  SaleList,
  Ticket,
  VerifySalePasswordRequest,
  VerifySalePasswordResult,
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

/** The `localStorage` key that holds the browser's device ID in `'browser'` mode. */
export const DEVICE_ID_STORAGE_KEY = 'jetron_fluid_device_id'

/**
 * How the client fills in `X-Device-ID` when a checkout call does not pass `deviceId`.
 *
 * - `'browser'`: one device ID per browser, kept in `localStorage`, used for every
 *   reservation, order and release call. Nothing to pass around.
 * - `'per-reservation'`: every `createReservation` call without a `deviceId` gets a new
 *   random ID, returned as `reservationToken`. Pass that token as `deviceId` to refresh
 *   the reservation, create the order or release it. Use this on a server, where one
 *   client serves many attendees.
 */
export type DeviceIdMode = 'browser' | 'per-reservation'

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
  /**
   * How `X-Device-ID` is filled in when a checkout call does not pass `deviceId`.
   * Defaults to `'browser'` when running in a browser and `'per-reservation'` elsewhere.
   */
  deviceIdMode?: DeviceIdMode
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

export interface ListTicketsOptions extends RequestOptions {
  /** Report ticket statuses for this sale only. */
  saleId?: string
}

export interface ReservationOptions extends RequestOptions {
  /**
   * The attendee's device ID (a UUID), sent as `X-Device-ID`. Pass a previous
   * `reservationToken` to refresh that reservation. When omitted, the client fills
   * it in according to `deviceIdMode`.
   */
  deviceId?: string
}

export interface ReleaseOptions extends RequestOptions {
  /**
   * The `reservationToken` to release, sent as `X-Device-ID`. Optional in
   * `'browser'` mode; required in `'per-reservation'` mode.
   */
  deviceId?: string
}

export interface CreateOrderOptions extends RequestOptions {
  /**
   * The `reservationToken` from the reservation response, sent as `X-Device-ID`.
   * Optional in `'browser'` mode; required in `'per-reservation'` mode.
   */
  deviceId?: string
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

  /** `GET /events/{slug}/gallery` — list an event's gallery images. */
  getEventGallery(
    slug: string,
    options?: ConditionalRequestOptions,
  ): Promise<ApiResult<EventGallery | null>>

  /** `GET /events/{slug}/tickets` — list an event's purchasable ticket types. */
  listTickets(slug: string, options?: ListTicketsOptions): Promise<ApiResult<Ticket[]>>

  /** `GET /events/{slug}/sales` — list an event's sales, including ended ones. */
  listSales(slug: string, options?: RequestOptions): Promise<ApiResult<SaleList>>

  /** `POST /events/{slug}/sales/{saleId}/verify-password` — check a sale password. */
  verifySalePassword(
    slug: string,
    saleId: string,
    body: VerifySalePasswordRequest,
    options?: RequestOptions,
  ): Promise<ApiResult<VerifySalePasswordResult>>

  /** `POST /events/{slug}/sales/{saleId}/waitlist` — join a sale's waitlist. */
  joinSaleWaitlist(
    slug: string,
    saleId: string,
    body: JoinSaleWaitlistRequest,
    options?: RequestOptions,
  ): Promise<ApiResult<JoinSaleWaitlistResult>>

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
    options?: CreateOrderOptions,
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

function isBrowser(): boolean {
  return 'window' in globalThis && 'document' in globalThis
}

function randomDeviceId(): string {
  const webCrypto = globalThis.crypto
  if (typeof webCrypto?.randomUUID === 'function') return webCrypto.randomUUID()
  if (typeof webCrypto?.getRandomValues === 'function') {
    const bytes = webCrypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6]! & 0x0f) | 0x40
    bytes[8] = (bytes[8]! & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  throw new Error(
    'No secure random number generator is available to create a device ID. Pass `deviceId` yourself.',
  )
}

function readStoredDeviceId(): string | null {
  try {
    return globalThis.localStorage?.getItem(DEVICE_ID_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

function storeDeviceId(deviceId: string): void {
  try {
    globalThis.localStorage?.setItem(DEVICE_ID_STORAGE_KEY, deviceId)
  } catch {
    return
  }
}

function createBrowserDeviceIdSource(): () => string {
  let sessionDeviceId: string | undefined
  return () => {
    const stored = readStoredDeviceId()
    if (stored) return stored
    sessionDeviceId ??= randomDeviceId()
    storeDeviceId(sessionDeviceId)
    return sessionDeviceId
  }
}

function missingDeviceIdError(method: string): Error {
  return new Error(
    `${method} needs \`deviceId\` in 'per-reservation' mode. Pass the reservation's \`reservationToken\`.`,
  )
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

  const deviceIdMode = options.deviceIdMode ?? (isBrowser() ? 'browser' : 'per-reservation')
  const browserDeviceId = createBrowserDeviceIdSource()

  const reservationDeviceId = (deviceId: string | undefined): string => {
    if (deviceId) return deviceId
    if (deviceIdMode === 'browser') return browserDeviceId()
    return randomDeviceId()
  }

  const existingDeviceId = (deviceId: string | undefined, method: string): string => {
    if (deviceId) return deviceId
    if (deviceIdMode === 'browser') return browserDeviceId()
    throw missingDeviceIdError(method)
  }

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

    getEventGallery: (slug, opts = {}) => {
      const { ifNoneMatch, ...rest } = opts
      return request<EventGallery | null>('GET', `/events/${encode(slug)}/gallery`, {
        ifNoneMatch,
        ...rest,
      })
    },

    listTickets: (slug, opts = {}) => {
      const { saleId, ...rest } = opts
      return request<Ticket[]>('GET', `/events/${encode(slug)}/tickets`, {
        query: { saleId },
        ...rest,
      })
    },

    listSales: (slug, opts = {}) => request<SaleList>('GET', `/events/${encode(slug)}/sales`, opts),

    verifySalePassword: (slug, saleId, body, opts = {}) =>
      request<VerifySalePasswordResult>(
        'POST',
        `/events/${encode(slug)}/sales/${encode(saleId)}/verify-password`,
        { body, ...opts },
      ),

    joinSaleWaitlist: (slug, saleId, body, opts = {}) =>
      request<JoinSaleWaitlistResult>(
        'POST',
        `/events/${encode(slug)}/sales/${encode(saleId)}/waitlist`,
        { body, ...opts },
      ),

    createReservation: async (slug, body, opts = {}) => {
      const { deviceId, ...rest } = opts
      return request<Reservation>('POST', `/events/${encode(slug)}/reservations`, {
        body,
        deviceId: reservationDeviceId(deviceId),
        ...rest,
      })
    },

    releaseReservation: async (slug, opts = {}) => {
      const { deviceId, ...rest } = opts
      return request<ReleaseResult>('DELETE', `/events/${encode(slug)}/reservations`, {
        deviceId: existingDeviceId(deviceId, 'releaseReservation'),
        ...rest,
      })
    },

    createOrder: async (slug, body, opts = {}) => {
      const { deviceId, ...rest } = opts
      return request<Order>('POST', `/events/${encode(slug)}/orders`, {
        body,
        deviceId: existingDeviceId(deviceId, 'createOrder'),
        ...rest,
      })
    },
  }
}
