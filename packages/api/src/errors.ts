/**
 * The error envelope returned by the API:
 * `{ "message": string, "status": <http code>, "error_code": string }`.
 */
export interface ApiErrorBody {
  message: string
  status: number
  error_code: string
}

/**
 * Thrown when the API responds with a non-2xx status. Carries the parsed error
 * envelope plus the raw {@link Response} for advanced handling.
 */
export class ApiError extends Error {
  /** The HTTP status code. */
  readonly status: number
  /** Stable machine-readable error identifier (e.g. `unauthorized`), if provided. */
  readonly errorCode: string | null
  /** The raw fetch Response. */
  readonly response: Response
  /** The parsed response body, if any. */
  readonly body: unknown

  constructor(
    message: string,
    options: {
      status: number
      errorCode?: string | null
      response: Response
      body?: unknown
    },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.errorCode = options.errorCode ?? null
    this.response = options.response
    this.body = options.body
    // Restore the prototype chain for instanceof checks after transpilation.
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  static fromResponse(response: Response, body: unknown): ApiError {
    const envelope = body as Partial<ApiErrorBody> | undefined
    const message =
      envelope?.message ?? response.statusText ?? `Request failed with status ${response.status}`
    return new ApiError(message, {
      status: envelope?.status ?? response.status,
      errorCode: envelope?.error_code ?? null,
      response,
      body,
    })
  }
}
