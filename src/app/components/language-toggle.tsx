import { Languages } from "lucide-react";

import { Button } from "@/components/ui";
import { LOCALES, LOCALE_LABELS, useTranslation } from "@/i18n";

/**
 * A single control that switches to the other language.
 *
 * There are exactly two languages, so a picker would be a menu with one useful
 * entry in it. A button is the whole interaction, and it names its destination
 * rather than its current state — "العربية" means *go to Arabic*, which is
 * what someone looking for it is trying to do. Naming the current language
 * instead would leave them guessing whether the button reports or acts.
 *
 * The label is always written in the language it leads to, never translated:
 * someone who cannot read the current language has to be able to find their way
 * out of it.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  const next = LOCALES.find((value) => value !== locale) ?? locale;

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => setLocale(next)}
      aria-label={t("app.switchTo", { language: LOCALE_LABELS[next] })}
      title={t("app.switchTo", { language: LOCALE_LABELS[next] })}
      lang={next}
    >
      <Languages />
      {LOCALE_LABELS[next]}
    </Button>
  );
}
