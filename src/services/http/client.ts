import { apiConfig } from "@/config";
import { AppError, appErrorCodeFromStatus, buildQueryString, toAppError } from "@/lib";
import type { QueryParamValue } from "@/lib";

import { readErrorBody } from "./error-body";
import { clearTokens, readTokens, writeTokens, type TokenPair } from "./token-store";
import type { HttpRequestOptions } from "./types";

/**
 * The single place the admin is allowed to talk to a network.
 *
 * It speaks the live API's contract: every admin path is under `/v1/admin`,
 * bodies are JSON (a `FormData` body — an upload — goes as multipart, with the
 * browser writing its boundary), lists repeat their key, and errors arrive as
 * RFC 7807 problem details (the reference server's `{ "error": { … } }` too) —
 * which become an `AppError` here, field errors included (`./error-body`), so
 * a form shows the API's own words.
 *
 * AUTH. The live API is bearer-token based (sign-in returns an access +
 * refresh token pair, nearly every endpoint requires `Authorization: Bearer`),
 * not the httpOnly-cookie session this client originally assumed. A call made
 * with `auth: true` attaches the stored access token; a 401 on such a call
 * triggers exactly one silent refresh-and-retry (`attemptRequest` below)
 * before the error is allowed to surface. See `./token-store` for where the
 * tokens actually live and why.
 */
function resolveUrl(path: string, query?: Record<string, unknown>): string {
  const base = apiConfig.baseUrl.replace(/\/$/, "");
  const suffix = query
    ? buildQueryString(query as Record<string, QueryParamValue | readonly QueryParamValue[]>)
    : "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}${suffix}`;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  /* `application/json`, and `application/problem+json` for the live API's errors. */
  if (!/[/+]json\b/.test(contentType)) return undefined;
  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Exchanges the stored refresh token for a new token pair. Returns the new
 * access token, or `undefined` when there's no refresh token to use or the
 * API rejects it — the caller then falls through to the ordinary 401
 * handling, same as any other expired/absent session.
 */
async function refreshSession(): Promise<string | undefined> {
  const refreshToken = readTokens()?.refreshToken;
  if (!refreshToken) return undefined;
  try {
    const refreshed = await httpRequest<TokenPair>("/v1/admin/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
    writeTokens(refreshed);
    return refreshed.accessToken;
  } catch {
    clearTokens();
    return undefined;
  }
}

export async function httpRequest<TResponse>(
  path: string,
  options: HttpRequestOptions = {},
): Promise<TResponse> {
  if (!apiConfig.baseUrl) {
    throw new AppError(
      "unavailable",
      "No API base URL is configured. Set VITE_API_BASE_URL before using the HTTP data source.",
    );
  }
  return attemptRequest<TResponse>(path, options, true);
}

/**
 * The actual fetch, retried at most once: a 401 on an `auth: true` call
 * triggers exactly one silent token refresh before the error is allowed to
 * surface. `canRefresh` is `false` on the retry so a refresh token the API
 * also rejects can't loop.
 */
async function attemptRequest<TResponse>(
  path: string,
  options: HttpRequestOptions,
  canRefresh: boolean,
): Promise<TResponse> {
  const timeoutSignal = AbortSignal.timeout(options.timeoutMs ?? apiConfig.timeoutMs);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  const token = options.auth ? readTokens()?.accessToken : undefined;

  try {
    const response = await fetch(resolveUrl(path, options.query), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        /* No Content-Type for a form: the browser sets it, with the boundary. */
        ...(options.body === undefined || isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body:
        options.body === undefined
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      signal,
    });

    if (response.status === 401 && options.auth && canRefresh) {
      const refreshedToken = await refreshSession();
      if (refreshedToken) return attemptRequest<TResponse>(path, options, false);
    }

    const payload = await parseBody(response);

    if (!response.ok) {
      const error = readErrorBody(payload);
      throw new AppError(
        (error.code as AppError["code"] | undefined) ?? appErrorCodeFromStatus(response.status),
        error.message ?? `Request to ${path} failed with status ${response.status}.`,
        { status: response.status, fieldErrors: error.fieldErrors },
      );
    }

    return payload as TResponse;
  } catch (error) {
    throw toAppError(error);
  }
}

/** For "get one" calls whose contract answers `null` when the record is gone. */
export async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof AppError && error.code === "not-found") return null;
    throw error;
  }
}

export const httpClient = {
  get: <T>(path: string, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<T>(path, { ...options, method: "DELETE" }),
} as const;

/**
 * GET a private file — a candidate's CV — with the staff member's bearer token.
 *
 * Fetched rather than linked so a refusal (401, 403, 404) arrives as an
 * `AppError` the screen can show, instead of a browser tab full of JSON. The
 * API answers these with `Cache-Control: private, no-store`; the bytes are
 * handed to the caller and never kept. No silent refresh here, unlike
 * `attemptRequest` — downloads are infrequent enough that an expired token
 * simply fails, same as any other 401.
 */
export async function httpDownload(path: string): Promise<{ blob: Blob; fileName: string }> {
  if (!apiConfig.baseUrl) {
    throw new AppError("unavailable", "No API base URL is configured. Set VITE_API_BASE_URL before using the HTTP data source.");
  }
  const token = readTokens()?.accessToken;
  try {
    const response = await fetch(resolveUrl(path), {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(apiConfig.timeoutMs),
    });
    if (!response.ok) {
      const error = readErrorBody(await parseBody(response));
      throw new AppError(
        (error.code as AppError["code"] | undefined) ?? appErrorCodeFromStatus(response.status),
        error.message ?? `Request to ${path} failed with status ${response.status}.`,
        { status: response.status },
      );
    }
    const disposition = response.headers.get("content-disposition") ?? "";
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    const plain = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
    const fileName = encoded ? decodeURIComponent(encoded) : (plain ?? path.split("/").slice(-2, -1)[0] ?? "download");
    return { blob: await response.blob(), fileName };
  } catch (error) {
    throw toAppError(error);
  }
}
