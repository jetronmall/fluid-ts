/**
 * Type definitions for the Jetron Fluid (Jetron Ticket headless) API.
 *
 * Mirrors `specs/openapi.yaml`. All monetary amounts are integers in the
 * smallest currency unit (kobo for NGN, pesewa for GHS, cents for ZAR).
 * All date-time values are ISO 8601 strings.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type Country = 'NIGERIA' | 'GHANA' | 'SOUTH_AFRICA'

export type EventStatus = 'LIVE' | 'COMING_SOON' | 'CLOSED' | 'SOLD_OUT' | 'ACTIVE'

export type TicketStatus =
  | 'AVAILABLE'
  | 'SOLD_OUT'
  | 'COMING_SOON'
  | 'CLOSED'
  | 'DEADLINE_EXCEEDED'
  | 'SALE_NOT_STARTED'
  | 'SALE_ENDED'

export type OrderStatus = 'confirmed' | 'pending_payment'

export type EventArtistPlatform = 'SPOTIFY' | 'DEEZER'

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface EventCategory {
  name: string
  slug: string
}

/** The event fields returned by list endpoints. */
export interface EventSummary {
  id: string
  name: string
  slug: string
  posterImageURL: string
  /** Width/height of the poster image. Absent when unknown. */
  posterAspectRatio?: number
  category?: EventCategory | null
  /** Lowest ticket price (after commission), in the smallest currency unit. 0 when none. */
  cheapestTicketPrice: number
  /** Human-readable, country-formatted cheapest price. "Free" when 0. */
  formattedCheapestPrice: string
  description: string
  /** Plain-text preview derived from the markdown description. */
  previewDescription: string
  date: string
  closingDate: string
  timezone: string
  status: EventStatus
  isComingSoon: boolean
  instagram?: string
  website?: string
  xAccount?: string
  country?: Country
  state?: string
  lga?: string
  street?: string
  directions?: string
  lng?: number
  lat?: number
  hideLocation: boolean
  hostMessage?: string
  createdAt: string
}

/** A public artist profile linked to an event headliner. */
export interface EventArtistProfile {
  id: string
  artistPlatformId: string
  platform: EventArtistPlatform
  name: string
  slug?: string
  imageURL?: string
  description?: string
  bannerURL?: string
}

/** A guest or performer featured on an event page. */
export interface EventHeadliner {
  id: string
  name: string
  role?: string
  imageURL?: string
  /** Whether this is the event's default headliner. */
  isMainArtist: boolean
  artist?: EventArtistProfile
}

/** The full event detail returned by `GET /events/{slug}`. */
export interface Event extends EventSummary {
  /** Public guests and performers featured on the event page. */
  headliners: EventHeadliner[]
}

export interface EventGalleryImage {
  id: string
  imageURL: string
  altText?: string
}

export interface EventGallery {
  items: EventGalleryImage[]
}

export interface EventList {
  items: EventSummary[]
  /** Pass as `cursor` to fetch the next page. Absent on the last page. */
  nextCursor?: string
}

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------

/** A ticket bundled inside a combo ticket. */
export interface SubTicket {
  id: string
  name: string
}

export interface Ticket {
  id: string
  name: string
  slug: string
  description?: string
  imageURL?: string
  /** Price the buyer pays (after commission), in the smallest currency unit. */
  price: number
  /** Human-readable, country-formatted price ("FREE" when 0). */
  formattedPrice: string
  /** Platform fees included for this ticket, in the smallest currency unit. */
  fees: number
  formattedFees: string
  /** Maximum quantity purchasable per order. */
  maximumPurchasableTicketCount: number
  /** Tickets available to buy right now (after sold + held stock). */
  quantityLeft: number
  /** How many admissions one ticket grants (group size). */
  orderCount: number
  /** When sales for this ticket close. */
  deadline?: string
  date?: string
  status: TicketStatus
  /** Whether one ticket admits multiple people (orderCount > 1). */
  isGroup: boolean
  /** Whether this ticket bundles other tickets (see subTickets). */
  isCombo: boolean
  /** Whether this is a free RSVP/registration ticket. */
  isRsvp: boolean
  /** For combo tickets, the tickets bundled inside. */
  subTickets?: SubTicket[]
  position: number
  /** If set, only buyers with an email on this domain may purchase. */
  emailDomainRestriction?: string
}

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

export interface ReservationItemRequest {
  /** The ticket type ID (from the tickets endpoint). */
  sku: string
  quantity: number
}

export interface CreateReservationRequest {
  items: ReservationItemRequest[]
  /** Optional event promo code. Global promo codes are not supported. */
  promoCode?: string
}

export interface ReservationItemView {
  sku: string
  quantity: number
  /** Per-ticket price (after commission), in the smallest currency unit. */
  price: number
  /** Per-ticket platform fee, in the smallest currency unit. */
  fee: number
}

export interface Reservation {
  /** Echo as the `X-Device-ID` header on order and release calls. */
  reservationToken: string
  /** Opaque handle to the priced, server-held quote. Send back when ordering. */
  quoteReference: string
  /** Cart total (after commission), in the smallest currency unit. */
  total: number
  /** Total platform fees included in the total. */
  totalFees: number
  /** Discount applied by a promo code, if any. */
  discount?: number
  promoCode?: string
  items: ReservationItemView[]
  /** Client-facing deadline to drive your checkout countdown. */
  clientExpiresAt: string
}

/** Result of releasing a reservation. */
export interface ReleaseResult {
  released: true
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface CreateOrderRequest {
  /** The `quoteReference` returned by the reservation response. */
  quoteReference: string
  /** The attendee's email; tickets are issued to this address. */
  email: string
  firstName: string
  lastName: string
  phone?: string
  /** Where the attendee is redirected after payment (a `reference` is appended). */
  callbackUrl: string
  acceptPromotionalContent?: boolean
  /** Optional JSON object (max 4096 bytes) echoed in the TICKET_PURCHASED webhook. */
  metadata?: Record<string, unknown>
}

export interface Order {
  /** `confirmed` for free orders; `pending_payment` for paid orders. */
  status: OrderStatus
  /** The order reference. Present for free orders; paid orders receive it on callback. */
  reference: string
  /** Payment link for paid orders; your callbackUrl (with reference) for free orders. */
  checkoutUrl: string
  total: number
  discount?: number
  promoCode?: string
  clientExpiresAt?: string
}

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export interface HealthChecks {
  postgres: boolean
  redis: boolean
  meilisearch: boolean
  rabbitmq: boolean
  neo4j: boolean
  mongodb: boolean
}

export interface Health {
  /** Overall readiness (Postgres AND Redis reachable). */
  status: boolean
  message: string
  data: HealthChecks
}
