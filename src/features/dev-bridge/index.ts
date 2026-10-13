/**
 * Mirrors the storefront's account store while both dev servers run — mock
 * data source only. Against a real backend both apps read the API and this
 * feature is deleted with `src/mocks`.
 */
export { isBridgeLive, startStorefrontBridge } from "./services/dev-bridge.mock";
