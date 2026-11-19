/**
 * @jetronticket/api
 *
 * TypeScript client for Jetron Fluid, the Jetron Ticket headless API.
 * Works in browsers and Node.js 20+ using the platform `fetch`.
 */

export { createClient, DEFAULT_BASE_URL, DEVICE_ID_STORAGE_KEY } from './client'
export type {
  ApiResult,
  ConditionalRequestOptions,
  CreateOrderOptions,
  DeviceIdMode,
  JetronFluidClient,
  JetronFluidClientOptions,
  ListEventsParams,
  ListTicketsOptions,
  ReleaseOptions,
  RequestOptions,
  ReservationOptions,
} from './client'

export { ApiError } from './errors'
export type { ApiErrorBody } from './errors'

export type {
  Country,
  CreateOrderRequest,
  CreateReservationRequest,
  Event,
  EventArtistPlatform,
  EventArtistProfile,
  EventCategory,
  EventGallery,
  EventGalleryImage,
  EventHeadliner,
  EventList,
  EventStatus,
  EventSummary,
  Health,
  HealthChecks,
  JoinSaleWaitlistRequest,
  JoinSaleWaitlistResult,
  Order,
  OrderStatus,
  ReleaseResult,
  Reservation,
  ReservationItemRequest,
  ReservationItemView,
  Sale,
  SaleList,
  SalePhase,
  SubTicket,
  Ticket,
  TicketSale,
  TicketStatus,
  VerifySalePasswordRequest,
  VerifySalePasswordResult,
} from './types'
