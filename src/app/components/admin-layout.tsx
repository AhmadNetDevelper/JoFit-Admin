import { ExternalLink, Moon, Sun } from "lucide-react";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { Outlet, useMatches } from "react-router-dom";

import { SkipLink } from "@/components/layout";
import { Button, Separator } from "@/components/ui";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { appConfig } from "@/config";
import { useTranslation } from "@/i18n";
import { reveal, slideIn } from "@/lib/reveal";
import { useTheme } from "@/theme";

import { AdminSidebar } from "./admin-sidebar";
import { LayoutControls } from "./layout-controls";
import { NavigationProgress } from "./navigation-progress";
import { NotificationsMenu } from "./notifications-menu";

/**
 * The admin shell: the sidebar, a 56px bar, and the screen.
 *
 * `SidebarProvider` owns the collapsed state, the mobile sheet and the keyboard
 * shortcut, so neither this file nor any screen has to.
 *
 * The bar carries only chrome — the trigger, the appearance, the language, the
 * way out. Anything that belongs to a screen lives on that screen, which is why
 * there is no global "quick create": an action that matters on the orders screen
 * belongs on the orders screen, where the reader can see what it applies to.
 *
 * Spacing uses logical properties, so the whole layout mirrors when Arabic sets
 * `dir="rtl"`.
 *
 * ---------------------------------------------------------------------------
 * HOW THE ADMIN ARRIVES, and the only motion it has.
 *
 * Once, when the shell first mounts — which is the moment after sign-in — the
 * rail slides in whole from the window's outer edge, the bar drops in after it,
 * and the screen rises. It is the same gesture as the sign-in panel, played
 * the other way round, so walking through the door and into the room read as
 * one movement.
 *
 * After that, each screen rises into place when it opens (`screenId` below),
 * and its content cascades in when its data lands (`AsyncBoundary`). Then
 * everything is still. Nothing hovers, bobs or follows the pointer: this is a
 * tool staff have open all day, and the forms in it must sit still.
 *
 * The rail's direction comes from the document's, like the sign-in panel's —
 * the left in English, the right in Arabic. Reduced motion skips all of it.
 */
export function AdminLayout() {
  const { t, direction } = useTranslation();
  const { resolvedMode, preferences, toggleMode } = useTheme();
  const barRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* The route that owns the screen. Two URLs on one route (`/support` and
     `/support/:id`) are two ids, so each still gets its entrance; a screen's
     own query-string changes are not a new screen and do not replay it. */
  const screenId = useMatches().at(-1)?.id;

  useLayoutEffect(() => {
    slideIn(document.querySelector("[data-slot=sidebar-container]"), `translate(${direction === "rtl" ? "100%" : "-100%"}, 0px)`, {
      duration: 0.8,
    });
    slideIn(barRef.current, "translate(0px, -100%)", { duration: 0.6, delay: 0.2 });
    // Once per shell: the direction at mount is the one it arrived from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    reveal(contentRef.current, { direct: true, skip: "[data-reveal-self]", delay: 0.05 });
  }, [screenId]);

  return (
    <SidebarProvider
      style={
        {
          /* The reference widens the rail from the primitive's 16rem default;
             at 16rem the longer Arabic labels wrap. */
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as CSSProperties
      }
    >
      <SkipLink />
      <AdminSidebar
        variant={preferences.sidebarVariant}
        collapsible={preferences.sidebarCollapsible}
      />

      <SidebarInset className="min-w-0 overflow-x-clip md:peer-data-[variant=inset]:border">
        <header
          ref={barRef}
          className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-background/70 backdrop-blur-md backdrop-saturate-150"
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger
                className="-ms-1 rtl:[&_svg]:-scale-x-100"
                aria-label={t("app.toggleSidebar")}
                title={t("app.toggleSidebar")}
              />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
              />
              <a
                href={appConfig.storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
                <span className="max-sm:sr-only">{t("app.viewStorefront")}</span>
              </a>
            </div>

            <div className="flex items-center gap-1">
              <NotificationsMenu />

              {/* The one-click light/dark flip stays in the bar because it is
                  used constantly; everything else lives behind the gear. */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMode}
                aria-pressed={resolvedMode === "dark"}
                aria-label={t("app.appearance")}
                title={t("app.appearance")}
              >
                {resolvedMode === "dark" ? <Moon /> : <Sun />}
              </Button>

              <LayoutControls />

            </div>
          </div>
          <NavigationProgress />
        </header>

        {/* `SidebarInset` is itself the <main>, so this is a div: two main
            landmarks on one page is worse than none. It keeps the id and takes
            `tabIndex={-1}` so the skip link can move focus here. The centred
            width is a preference, applied through a data attribute on <html> so
            no screen has to know.

            It is also the column that spaces a screen's top-level blocks. Most
            screens return a fragment, so their PageHeader and their content land
            here as siblings; without this gap they sat flush against each other.
            The 24px matches `AsyncBoundary`, which spaces the sections one level
            further in — one distance between blocks, wherever the block came
            from. */}
        <div
          ref={contentRef}
          id="main-content"
          tabIndex={-1}
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-x-clip p-4 md:p-6 [html[data-content-layout=centered]_&>*]:mx-auto [html[data-content-layout=centered]_&>*]:w-full [html[data-content-layout=centered]_&>*]:max-w-(--breakpoint-2xl)"
        >
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
