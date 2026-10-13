import type { ReactNode } from "react";
import { RouterProvider } from "react-router-dom";

import { NoticeProvider } from "@/components/feedback";
import { DirectionProvider, TooltipProvider } from "@/components/ui";
import { SessionProvider } from "@/features/auth";
import { I18nProvider, LOCALE_DIRECTION, useTranslation } from "@/i18n";
import { ThemeProvider } from "@/theme";

import { ActionCountsProvider } from "./action-counts";
import { MotionProvider } from "./motion-provider";
import { router } from "./router";

/**
 * Radix positions menus, tooltips and the mobile sidebar sheet from its own
 * direction context, not from the `dir` attribute on the document. Without this
 * every one of them opens against the reading direction in Arabic.
 *
 * It is a separate component because it has to read the locale, which means
 * being *inside* `I18nProvider`.
 */
function DirectedProviders({ children }: { children: ReactNode }) {
  const { locale } = useTranslation();

  return (
    <DirectionProvider dir={LOCALE_DIRECTION[locale]}>
      <TooltipProvider>
        <NoticeProvider>{children}</NoticeProvider>
      </TooltipProvider>
    </DirectionProvider>
  );
}

/**
 * Provider order matters.
 *
 * `ThemeProvider` is outermost because it writes to the document element rather
 * than rendering anything, so the appearance is settled before the first screen
 * paints. `I18nProvider` wraps the rest because the auth guard and its loading
 * states are themselves translated.
 *
 * `ActionCountsProvider` sits inside `SessionProvider` because the counts are
 * the signed-in user's work queue, and outside the router because both the rail
 * and the bell read them — one fetch, two consumers.
 *
 * `MotionProvider` is near the top so every screen, sign-in included, animates
 * through the one lazily loaded engine — see `motion-provider.tsx`.
 *
 * `TooltipProvider` sits at the root because tooltips are opened from anywhere —
 * the collapsed sidebar is the first case, and every icon-only control after it.
 * Radix requires the provider above every `Tooltip`, and it also holds the
 * shared open/close delay, which is what stops the second tooltip in a row from
 * waiting all over again.
 */
export function App() {
  return (
    <ThemeProvider>
      <MotionProvider>
        <I18nProvider>
          <DirectedProviders>
            <SessionProvider>
              <ActionCountsProvider>
                <RouterProvider router={router} />
              </ActionCountsProvider>
            </SessionProvider>
          </DirectedProviders>
        </I18nProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}
