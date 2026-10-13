export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpRequestOptions {
  readonly method?: HttpMethod;
  readonly query?: Record<string, unknown>;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  /** Forward the signed-in staff member's bearer token. Same option, same name, as the storefront's client. */
  readonly auth?: boolean;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}
