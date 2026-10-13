import { hydrateFromStorefront, isBridgeLive, startBridgePolling } from "@/mocks/bridge";

/**
 * Start-up for the storefront bridge (see `src/mocks/bridge.ts`): one read
 * before the app renders, so the first screen already shows live data, then a
 * poll while the tab is open. Resolves whether the storefront answered.
 */
export async function startStorefrontBridge(): Promise<boolean> {
  const connected = await hydrateFromStorefront();
  startBridgePolling();
  return connected;
}

export { isBridgeLive };
