import { useMemo, type ReactNode } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { LOCALE_DIRECTION, useTranslation } from "@/i18n";
import { useTheme } from "@/theme";

import { NoticeContext, type NoticeApi } from "./use-notice";

/**
 * SHORT CONFIRMATIONS — "Saved", "Deleted" — shown with shadcn/ui's Sonner
 * toaster: one polite live region, stacked at the reading-end bottom corner
 * (mirrored in Arabic), in the admin's light or dark theme. A failure also
 * stays in the form it came from, so nothing important lives only here.
 */
export function NoticeProvider({ children }: { children: ReactNode }) {
  const { locale } = useTranslation();
  const { resolvedMode } = useTheme();
  const dir = LOCALE_DIRECTION[locale];

  const api = useMemo<NoticeApi>(
    () => ({
      success: (message) => void toast.success(message),
      error: (message) => void toast.error(message),
    }),
    [],
  );

  return (
    <NoticeContext.Provider value={api}>
      {children}
      <Toaster theme={resolvedMode} dir={dir} position={dir === "rtl" ? "bottom-left" : "bottom-right"} />
    </NoticeContext.Provider>
  );
}
