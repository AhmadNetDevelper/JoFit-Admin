import { Link } from "react-router-dom";

import { StateMessage } from "@/components/feedback";
import { buttonVariants } from "@/components/ui";
import { useTranslation } from "@/i18n";

export function NotFoundRoute() {
  const { t } = useTranslation();

  return (
    <StateMessage
      title={t("notFound.title")}
      description={t("notFound.description")}
      action={
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          {t("nav.dashboard")}
        </Link>
      }
    />
  );
}
