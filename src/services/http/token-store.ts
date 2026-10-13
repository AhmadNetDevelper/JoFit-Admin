/**
 * The staff session's bearer token pair, held in `sessionStorage`.
 *
 * The live API has no httpOnly-cookie option for a bearer flow — sign-in
 * returns `{accessToken, refreshToken, expiresOnUtc}` in the response body,
 * and the SPA is the only thing that can hold it. `sessionStorage` survives a
 * page reload within the tab and is gone when the tab closes; it is still
 * JS-readable, so still exposed to a successful XSS the way any SPA-held
 * token is.
 *
 * OPEN BUSINESS DECISION: a backend-issued httpOnly-cookie session (the
 * pattern the storefront already uses, see `website/src/features/auth`)
 * would close that gap; it isn't what the live API offers today.
 */
export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresOnUtc: string;
}

const STORAGE_KEY = "jofit.admin.session-tokens";

export function readTokens(): TokenPair | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<TokenPair>;
    return typeof parsed.accessToken === "string" && typeof parsed.refreshToken === "string"
      ? (parsed as TokenPair)
      : undefined;
  } catch {
    return undefined;
  }
}

export function writeTokens(tokens: TokenPair): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    /* A private-browsing tab or a full quota loses the session on reload — the
       same place an expired cookie would leave a signed-out visitor. */
  }
}

export function clearTokens(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Nothing to clear if storage was never writable in the first place. */
  }
}
