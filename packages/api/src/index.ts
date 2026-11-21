/**
 * @jetronticket/api
 *
 * TypeScript client for Jetron Fluid, the Jetron Ticket headless API.
 * Works in browsers and Node.js 20+ using the platform `fetch`.
 */

export {
  createClient,
  DEFAULT_BASE_URL,
  DEVICE_ID_STORAGE_KEY,
  PRIVATE_API_KEY_PREFIX,
} from './client'
export type {
  ApiResult,
  ConditionalRequestOptions,
  CreateOrderOptions,
  DeviceIdMode,
  JetronFluidClient,
  JetronFluidClientOptions,
  ListEventsParams,
  ListMomentsParams,
  ListTicketsOptions,
  ReleaseOptions,
  RequestOptions,
  ReservationOptions,
  ValidatePromoCodeOptions,
} from './client'

export { ApiError } from './errors'
export type { ApiErrorBody } from './errors'

export type {
  AttendeeTicket,
  AttendeeTicketEvent,
  AttendeeTicketOrder,
  AttendeeTicketOrderList,
  AttendeeTicketStatus,
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
  Host,
  JoinSaleWaitlistRequest,
  JoinSaleWaitlistResult,
  LookupAttendeeTicketsRequest,
  Moment,
  MomentAuthor,
  MomentList,
  Order,
  OrderDetails,
  OrderDetailsStatus,
  OrderLine,
  OrderStatus,
  PromoCode,
  PromoCodeType,
  ReleaseResult,
  Reservation,
  ReservationItemRequest,
  ReservationItemView,
  Sale,
  SaleList,
  SalePhase,
  Sponsor,
  SponsorList,
  SubTicket,
  Ticket,
  TicketSale,
  TicketStatus,
  ValidatePromoCodeRequest,
  VerifySalePasswordRequest,
  VerifySalePasswordResult,
} from './types'
