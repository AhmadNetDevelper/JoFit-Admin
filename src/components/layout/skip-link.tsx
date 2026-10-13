import { useTranslation } from "@/i18n";

/**
 * First focusable element on the page. `start-4` rather than `left-4` so it
 * lands on the correct side in both text directions.
 */
export function SkipLink() {
  const { t } = useTranslation();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:rounded-md focus:border focus:border-primary focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
    >
      {t("app.skipToContent")}
    </a>
  );
}
