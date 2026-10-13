import * as icons from "lucide-react";
import type * as React from "react";
import { Link, useLocation } from "react-router-dom";

import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { adminNav, isFeatureEnabled, type NavIconKey } from "@/config";
import { can, useSession } from "@/features/auth";
import { LOCALE_DIRECTION, useFormatters, useTranslation } from "@/i18n";

import { useActionCounts } from "../use-action-counts";
import type { TranslationKey } from "@/i18n";

/**
 * Sidebar rendered from `config/navigation.ts`. Groups whose items are all
 * hidden — by feature flag or by permission — disappear entirely rather than
 * leaving an empty heading.
 *
 * Labels come from the dictionary and the icon travels with the nav entry, so
 * adding a screen means one entry plus one translation pair — never a change
 * here.
 *
 * The `Sidebar` primitives handle collapsing, the mobile sheet and the keyboard
 * shortcut; this file only says what goes in them.
 *
 * Each item is a `SidebarMenuButton asChild` wrapping a `Link`, which is the
 * upstream shape and the only correct one: the button renders *as* the anchor
 * instead of inside it. A `<button>` nested in an `<a>` is invalid HTML, and
 * browsers and screen readers disagree about which of the two they are
 * activating.
 *
 * Because `asChild` leaves no room for `NavLink`'s render prop, the active
 * state is derived from the location here. A nav entry is current when the path
 * matches it exactly or is a child of it, so `/orders/order-1` keeps "Orders"
 * marked — except for the dashboard at `/`, which every path is a child of and
 * so matches exactly.
 */
/* The create screens "Quick create" offers, each behind the permission its screen needs. */
const QUICK_CREATE: readonly {
  readonly to: string;
  readonly labelKey: TranslationKey;
  readonly icon: icons.LucideIcon;
  readonly permission: Parameters<typeof can>[1];
}[] = [
  { to: "/catalogue/products/new", labelKey: "nav.quickNewProduct", icon: icons.Package, permission: "catalogue:write" },
  { to: "/rental/items/new", labelKey: "nav.quickNewRentalItem", icon: icons.Boxes, permission: "rental:write" },
  { to: "/education/courses/new", labelKey: "nav.quickNewCourse", icon: icons.GraduationCap, permission: "education:write" },
  { to: "/content/articles/new", labelKey: "nav.quickNewArticle", icon: icons.FileText, permission: "content:write" },
  { to: "/content/menu/pages/new", labelKey: "nav.quickNewPage", icon: icons.ListTree, permission: "content:write" },
];

/*
 * A rail item. Quiet until it is the current one, which gets a lit pane, white
 * text, a gold icon and a gold bar on its inner edge: the one bright mark in
 * the rail, so the eye finds "where am I" without reading.
 */
const RAIL_ITEM =
  "relative text-sidebar-foreground/75 transition-colors hover:text-white [&>svg]:text-sidebar-foreground/50 hover:[&>svg]:text-sidebar-foreground/80 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-white data-[active=true]:[&>svg]:text-(--brand-gold) before:absolute before:inset-y-2 before:start-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity data-[active=true]:before:opacity-100";

const ICONS: Readonly<Record<NavIconKey, icons.LucideIcon>> = {
  dashboard: icons.LayoutDashboard,
  package: icons.Package,
  tags: icons.Tags,
  bookmark: icons.Bookmark,
  receipt: icons.ReceiptText,
  users: icons.Users,
  box: icons.Boxes,
  calendar: icons.CalendarDays,
  calendarCheck: icons.CalendarCheck,
  clipboard: icons.ClipboardList,
  warehouse: icons.Warehouse,
  whistle: icons.Dumbbell,
  graduation: icons.GraduationCap,
  article: icons.FileText,
  star: icons.Star,
  chat: icons.MessageSquare,
  quote: icons.FileSpreadsheet,
  activity: icons.Activity,
  settings: icons.Settings,
  menu: icons.ListTree,
  headset: icons.Headset,
  briefcase: icons.BriefcaseBusiness,
  building: icons.Building2,
  fileUser: icons.FileUser,
  list: icons.ListChecks,
  userCog: icons.UserCog,
  shield: icons.ShieldCheck,
};

export function AdminSidebar({
  variant,
  collapsible,
}: Pick<React.ComponentProps<typeof Sidebar>, "variant" | "collapsible">) {
  const { session, signOut } = useSession();
  const { t, locale } = useTranslation();
  const { pathname } = useLocation();
  const { isMobile } = useSidebar();
  const { number } = useFormatters();
  const counts = useActionCounts();

  const initials = (session?.user.name ?? "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  /* The longest entry the path falls under wins, so `/coaches/bookings/cb-1`
     marks "Coach bookings" and not "Coaches" as well. */
  const matches = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
  const quickCreate = QUICK_CREATE.filter((entry) => can(session, entry.permission));
  const current = adminNav
    .flatMap((group) => group.items.map((item) => item.to))
    .filter(matches)
    .sort((a, b) => b.length - a.length)[0];
  const isCurrent = (to: string) => (to === "/" ? pathname === "/" : to === current);

  const groups = adminNav
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => isFeatureEnabled(item.feature) && can(session, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);

  /*
   * `Sidebar` positions itself with physical CSS — `data-[side=left]:left-0`,
   * `data-[side=right]:right-0` — because it is `position: fixed` and logical
   * properties do not apply to a fixed box the way they do in flow.
   *
   * So the side has to be chosen, not inherited. Left it on `left` in Arabic and
   * the fixed panel pins to the left edge while the gap that reserves room for
   * it sits on the right, so the rail lands on top of the table and the columns
   * run off the screen.
   */
  return (
    <Sidebar
      side={LOCALE_DIRECTION[locale] === "rtl" ? "right" : "left"}
      variant={variant}
      collapsible={collapsible}
    >
      {/*
        The rail's scenery: the sign-in panel's floodlight, turned down. A gold
        glow in the head corner, a green one at the foot, and the court's dot
        grid fading out under the brand. STILL, unlike on the sign-in panel: a
        pattern that drifts in a panel someone has open all day is something to
        watch instead of work.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -start-24 -top-28 size-72 rounded-full bg-(--brand-gold)/18 blur-3xl" />
        <div className="absolute -end-24 -bottom-32 size-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="field-dots absolute inset-x-0 top-0 h-60 animate-none text-white/[0.07] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <SidebarHeader className="relative">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="hover:bg-transparent active:bg-transparent">
              <Link to="/" className="group/brand">
                {/* In a tool someone has open all day the mark answers the
                    pointer instead of moving on its own: a logo that floats in
                    the corner is a distraction, one that responds is feedback. */}
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.08] ring-1 ring-white/10">
                  <img src="/jofit-mark.png" alt="" aria-hidden="true" className="mark-hover h-3.5 w-auto" />
                </span>
                <span className="truncate text-[15px] font-semibold tracking-tight text-white">{t("app.name")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="relative">
        {/*
          The reference's action row. The inbox is real — quotations *is* an
          inbox in this product, and the button goes to it.

          "Quick create" opens a menu of the create screens this person's role
          can use. A role that can create nothing (a viewer) gets the button
          disabled, with a tooltip saying why, rather than an empty menu.
        */}
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
                {quickCreate.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        tooltip={t("nav.quickCreate")}
                        className="min-w-8 bg-sidebar-primary font-medium text-sidebar-primary-foreground shadow-[0_6px_18px_-8px_var(--brand-gold)] duration-200 ease-linear hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground active:bg-sidebar-primary/90 active:text-sidebar-primary-foreground data-[state=open]:bg-sidebar-primary/90 data-[state=open]:text-sidebar-primary-foreground"
                      >
                        <icons.PlusCircle />
                        <span>{t("nav.quickCreate")}</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-52">
                      {quickCreate.map((entry) => (
                        <DropdownMenuItem key={entry.to} asChild>
                          <Link to={entry.to}>
                            <entry.icon /> {t(entry.labelKey)}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <SidebarMenuButton
                    disabled
                    tooltip={t("nav.quickCreateUnavailable")}
                    className="min-w-8 bg-sidebar-primary text-sidebar-primary-foreground duration-200 ease-linear hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground active:bg-sidebar-primary/90 active:text-sidebar-primary-foreground"
                  >
                    <icons.PlusCircle />
                    <span>{t("nav.quickCreate")}</span>
                  </SidebarMenuButton>
                )}
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0 border-white/12 bg-white/[0.06] text-sidebar-foreground hover:bg-white/12 hover:text-white group-data-[collapsible=icon]:opacity-0 dark:border-white/12 dark:bg-white/[0.06]"
                >
                  <Link to="/quotations">
                    <icons.Mail />
                    <span className="sr-only">{t("nav.quotations")}</span>
                  </Link>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrent("/")}
                  tooltip={t("nav.dashboard")}
                  className={RAIL_ITEM}
                >
                  <Link to="/">
                    <icons.LayoutDashboard />
                    <span>{t("nav.dashboard")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {/*
              Sentence case, not the tracked-out capitals admin sidebars default
              to: Arabic has no capital letters, so `uppercase` does nothing to
              an Arabic heading and the two languages stop being the same design.
            */}
            <SidebarGroupLabel className="text-[11.5px] text-sidebar-foreground/45 group-data-[collapsible=icon]:pointer-events-none">
              {t(`nav.group.${group.label}` as TranslationKey)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const ItemIcon = ICONS[item.icon];
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isCurrent(item.to)}
                        tooltip={t(item.labelKey)}
                        className={RAIL_ITEM}
                      >
                        <Link to={item.to}>
                          <ItemIcon />
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                      {/*
                        The count of work waiting behind this screen. It is
                        inside the link's accessible name via aria-label rather
                        than left as a bare number, because "Reviews 3"
                        announced as "Reviews, 3" is only useful if the 3 is
                        attached to something.
                      */}
                      {counts[item.to] ? (
                        <SidebarMenuBadge
                          aria-label={t("nav.waiting", { count: number(counts[item.to] ?? 0) })}
                          className="rounded-full bg-white/10 px-1.5 text-[11px] text-white/85 peer-data-[active=true]/menu-button:bg-(--brand-gold)/20 peer-data-[active=true]/menu-button:text-(--brand-gold)"
                        >
                          {number(counts[item.to] ?? 0)}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {session ? (
        <SidebarFooter className="relative border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              {/*
                The reference's account menu carries Account, Billing and
                Notifications. None of the three exists here: there is no
                account route, nothing is billed, and notifications are already
                a live bell in the bar. Copying them would put three dead items
                in the one menu a person opens to leave. Sign out is the action
                this product backs, so it is the menu.

                It opens away from the rail, which is on the other side in
                Arabic — hence the direction check rather than the reference's
                hardcoded "right".
              */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                  >
                    <Avatar className="ring-2 ring-(--brand-gold)/60">
                      <AvatarFallback className="bg-(--brand-gold)/15 text-xs font-semibold text-(--brand-gold)">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="grid flex-1 text-start leading-tight">
                      <span className="truncate text-sm font-medium text-white">{session.user.name}</span>
                      <span className="truncate text-xs text-sidebar-foreground/55">
                        {session.user.email}
                      </span>
                    </span>
                    <icons.EllipsisVertical className="ms-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : LOCALE_DIRECTION[locale] === "rtl" ? "left" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-sm">
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="grid flex-1 text-start leading-tight">
                        <span className="truncate text-sm font-medium">{session.user.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {session.user.role}
                        </span>
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void signOut()}>
                    <icons.LogOut />
                    {t("app.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      ) : null}
    </Sidebar>
  );
}
