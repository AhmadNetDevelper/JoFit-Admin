import { useTranslation } from "@/i18n";

import { StateMessage } from "./state-message";

/**
 * Rendered where an area is architecturally present but switched off in
 * `config/features.ts`. It keeps the route and its types real while making the
 * incomplete state explicit rather than implied by an empty page.
 *
 * The feature's key is deliberately not interpolated into the sentence: it is a
 * code identifier, it has no Arabic, and a reader who is not the developer gains
 * nothing from seeing it.
 */
export function FeatureUnavailable() {
  const { t } = useTranslation();

  return (
    <StateMessage title={t("state.unavailableTitle")} description={t("state.unavailableBody")} />
  );
}
