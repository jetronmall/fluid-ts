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
  | 'ALL_RESERVED'
  | 'COMING_SOON'
  | 'CLOSED'
  | 'DEADLINE_EXCEEDED'
  | 'SALE_NOT_STARTED'
  | 'SALE_ENDED'

export type OrderStatus = 'confirmed' | 'pending_payment'

/** `confirmed` once payment is confirmed and tickets are issued; `refunded` after a refund. */
export type OrderDetailsStatus = 'confirmed' | 'refunded'

/** `PERCENTAGE` takes a percentage off; `FIXED` takes off an amount in the smallest currency unit. */
export type PromoCodeType = 'PERCENTAGE' | 'FIXED'

/**
 * `UPCOMING` before `startDate`, `ACTIVE` from `startDate` until `endDate`,
 * `ENDED` after `endDate`. A sale without an `endDate` stays `ACTIVE`.
 */
export type SalePhase = 'UPCOMING' | 'ACTIVE' | 'ENDED'

/**
 * `VALID` can be scanned. `USED` has been scanned. `TRANSFER_PENDING` can still be scanned
 * while a transfer awaits the recipient. `LOCKED` is only shown in the Jetron Ticket app.
 */
export type AttendeeTicketStatus = 'VALID' | 'USED' | 'TRANSFER_PENDING' | 'LOCKED'

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

/** A guest or performer in the event's lineup. */
export interface EventHeadliner {
  id: string
  name: string
  role?: string
  imageURL?: string
  /** Whether this is the event's main act. */
  isMainArtist: boolean
  artist?: EventArtistProfile
}

/** The full event detail returned by `GET /events/{slug}`. */
export interface Event extends EventSummary {
  /** The event's lineup: every public guest and performer. */
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

/** An event sponsor. */
export interface Sponsor {
  id: string
  name: string
  /** The sponsor's website. Absent when none was given. */
  url?: string
  /** The sponsor's logo. */
  imageURL: string
}

export interface SponsorList {
  items: Sponsor[]
}

/** The attendee who posted a moment, as shown publicly on Jetron Ticket. */
export interface MomentAuthor {
  name: string
  username?: string
  imageURL: string
}

/** A photo an attendee posted from the event. */
export interface Moment {
  id: string
  imageURL: string
  /** Image width in pixels. */
  width: number
  /** Image height in pixels. */
  height: number
  /** Width divided by height. */
  aspectRatio: number
  caption?: string
  likesCount: number
  commentsCount: number
  author: MomentAuthor
  createdAt: string
}

export interface MomentList {
  items: Moment[]
  /** Pass as `cursor` to fetch the next page. Absent on the last page. */
  nextCursor?: string
}

export interface EventList {
  items: EventSummary[]
  /** Pass as `cursor` to fetch the next page. Absent on the last page. */
  nextCursor?: string
}

// ---------------------------------------------------------------------------
// Host
// ---------------------------------------------------------------------------

/** The host that owns the API key. */
export interface Host {
  id: string
  name: string
  /** The host's handle on Jetron Ticket. */
  slug: string
  /** Profile image or logo. */
  imageURL: string
  /** Wide banner image. Absent when the host has none. */
  bannerImageURL?: string
  /** Whether Jetron Ticket has verified the host. */
  isVerified: boolean
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
  /** Open and upcoming sales that include this ticket. Empty when no sale is needed. */
  sales: TicketSale[]
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

/** A sale that includes a ticket, as listed on the ticket. */
export interface TicketSale {
  id: string
  name: string
  startDate: string
  endDate?: string
  phase: SalePhase
  requiresPassword: boolean
}

/** A timed sale, such as a presale or a general sale. */
export interface Sale {
  id: string
  name: string
  /** When the sale opens. */
  startDate: string
  /** When the sale closes. Absent when it has no end. */
  endDate?: string
  phase: SalePhase
  /** Whether buyers need a password. The password itself is never returned. */
  requiresPassword: boolean
  /** Whether the sale covers every ticket. When `true`, `ticketIds` is empty. */
  includeAllTickets: boolean
  /** The tickets in this sale, when it does not cover every ticket. */
  ticketIds: string[]
  /** Whether attendees can still join this sale's waitlist. */
  waitlistOpen: boolean
}

export interface SaleList {
  items: Sale[]
}

export interface VerifySalePasswordRequest {
  password: string
}

export interface VerifySalePasswordResult {
  valid: true
}

export interface JoinSaleWaitlistRequest {
  /** The attendee's full name. */
  name: string
  email: string
}

export interface JoinSaleWaitlistResult {
  joined: true
}

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------

export interface ValidatePromoCodeRequest {
  code: string
  /** The ticket IDs in the cart. Required for codes limited to some tickets. */
  ticketIds?: string[]
  /** How many tickets the code will cover. Defaults to 1. */
  quantity?: number
}

export interface PromoCode {
  code: string
  type: PromoCodeType
  /** A percentage (`10` is 10%) for `PERCENTAGE`, or an amount in the smallest currency unit for `FIXED`. */
  value: number
  /** The tickets the code applies to. Empty when it applies to every ticket. */
  ticketIds: string[]
  /** When the code stops working. Absent when it does not expire. */
  expiresAt?: string
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
  /** The sale to buy from. When omitted, the open sale is used for tickets that need one. */
  saleId?: string
  /** The sale's password, when the sale's `requiresPassword` is `true`. */
  salePassword?: string
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
  /** The attendee's device ID, sent as `X-Device-ID`. Pass it as `deviceId` on later calls. */
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
  /** The order reference. Look the order up with `getOrder`; it is also added to your callbackUrl. */
  reference: string
  /** Payment link for paid orders; your callbackUrl (with reference) for free orders. */
  checkoutUrl: string
  total: number
  discount?: number
  promoCode?: string
  clientExpiresAt?: string
}

export interface OrderLine {
  /** The ticket type bought. */
  sku: string
  /** The ticket name at purchase, even if the attendee later upgraded. */
  name: string
  /** Tickets bought. For a group ticket, the number of groups. */
  quantity: number
  /** Total paid for this ticket type, in the smallest currency unit. */
  amount: number
  formattedAmount: string
}

/** A confirmed order, returned by `GET /events/{slug}/orders/{reference}`. */
export interface OrderDetails {
  reference: string
  status: OrderDetailsStatus
  /** Amount paid, in the smallest currency unit. */
  total: number
  formattedTotal: string
  /** Discount from a promo code, if one was used. */
  discount?: number
  promoCode?: string
  items: OrderLine[]
  createdAt: string
}

// ---------------------------------------------------------------------------
// Attendee tickets
// ---------------------------------------------------------------------------

export interface LookupAttendeeTicketsRequest {
  /** The attendee's email. Matching ignores case and surrounding spaces. */
  email: string
  /** Only return tickets for this event. An unknown slug throws a 404 `ApiError`. */
  eventSlug?: string
  /**
   * `false` returns orders with at least one unscanned ticket for events that closed less
   * than a day ago or have not closed; `true` returns the rest. Omit for both.
   */
  used?: boolean
  /** Page size (1-100). Defaults to 20 server-side. */
  limit?: number
  /** The `nextCursor` from the previous page. */
  cursor?: string
}

export interface AttendeeTicketEvent {
  id: string
  name: string
  slug: string
  date: string
  closingDate: string
  timezone: string
}

export interface AttendeeTicket {
  id: string
  /** The admission's name; for bundles, the included ticket. */
  name: string
  /** The day this admission is for, on multi-day events. */
  date?: string
  status: AttendeeTicketStatus
  /** The entry QR code value. Present for `VALID` and `TRANSFER_PENDING`. */
  qrCode?: string
  scannedAt?: string
}

export interface AttendeeTicketOrder {
  id: string
  ticketId: string
  ticketName: string
  event: AttendeeTicketEvent
  /** The admissions on this order the email holds. */
  tickets: AttendeeTicket[]
  createdAt: string
}

export interface AttendeeTicketOrderList {
  items: AttendeeTicketOrder[]
  /** Pass as `cursor` to fetch the next page. Absent on the last page. */
  nextCursor?: string
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
