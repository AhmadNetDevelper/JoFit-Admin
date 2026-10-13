import { FeatureUnavailable } from "@/components/feedback";
import { PageHeader } from "@/components/ui";
import { useTranslation } from "@/i18n";
import type { TranslationKey } from "@/i18n";

/**
 * Screens that exist architecturally but are switched off. One component rather
 * than one file per area — there is nothing domain-specific left to say once a
 * feature is off, which is also why it takes only the title: the body is the
 * same sentence whichever area it is.
 */
export function FeatureBoundaryRoute({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t(titleKey)} />
      <FeatureUnavailable />
    </>
  );
}
