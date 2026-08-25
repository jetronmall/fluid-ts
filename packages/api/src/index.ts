/**
 * @jetronticket/api
 *
 * TypeScript client for Jetron Fluid, the Jetron Ticket headless API.
 * Works in browsers and Node.js 18+ using the platform `fetch`.
 */

export { createClient, DEFAULT_BASE_URL } from './client'
export type {
  ApiResult,
  ConditionalRequestOptions,
  CreateOrderOptions,
  JetronFluidClient,
  JetronFluidClientOptions,
  ListEventsParams,
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
  Order,
  OrderStatus,
  ReleaseResult,
  Reservation,
  ReservationItemRequest,
  ReservationItemView,
  SubTicket,
  Ticket,
  TicketStatus,
} from './types'
