import { Settings } from "lucide-react";

import {
  Button,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui";
import { LOCALES, LOCALE_LABELS, useTranslation } from "@/i18n";
import { useTheme } from "@/theme";

/**
 * The appearance panel: everything a member of staff may change about the
 * shell, in one place, behind one control.
 *
 * Each row is a toggle group rather than a menu, because every option is short
 * and there are never more than three: a menu would hide the current answer
 * behind a click, and the whole point of this panel is seeing what is set.
 *
 * Language belongs here rather than in the bar. It is the same kind of choice as
 * the rest — how the product is presented to *you* — and keeping it in the bar
 * put a wide select next to three icon buttons for no reason.
 */
export function LayoutControls() {
  const { t, locale, setLocale } = useTranslation();
  const { preferences, setPreference, resetPreferences } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("prefs.title")} title={t("prefs.title")}>
          <Settings />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h2 className="text-sm leading-none font-medium">{t("prefs.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("prefs.description")}</p>
          </div>

          <div className="space-y-3 **:data-[slot=toggle-group]:w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium">{t("app.language")}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={locale}
                onValueChange={(value) => value && setLocale(value as (typeof LOCALES)[number])}
              >
                {LOCALES.map((value) => (
                  <ToggleGroupItem key={value} value={value}>
                    {LOCALE_LABELS[value]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{t("prefs.mode")}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={preferences.themeMode}
                onValueChange={(value) => value && setPreference("themeMode", value as never)}
              >
                <ToggleGroupItem value="light">{t("prefs.light")}</ToggleGroupItem>
                <ToggleGroupItem value="dark">{t("prefs.dark")}</ToggleGroupItem>
                <ToggleGroupItem value="system">{t("prefs.system")}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{t("prefs.sidebarVariant")}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={preferences.sidebarVariant}
                onValueChange={(value) => value && setPreference("sidebarVariant", value as never)}
              >
                <ToggleGroupItem value="sidebar">{t("prefs.variantSidebar")}</ToggleGroupItem>
                <ToggleGroupItem value="floating">{t("prefs.variantFloating")}</ToggleGroupItem>
                <ToggleGroupItem value="inset">{t("prefs.variantInset")}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{t("prefs.sidebarCollapsible")}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={preferences.sidebarCollapsible}
                onValueChange={(value) =>
                  value && setPreference("sidebarCollapsible", value as never)
                }
              >
                <ToggleGroupItem value="icon">{t("prefs.collapseIcon")}</ToggleGroupItem>
                <ToggleGroupItem value="offcanvas">{t("prefs.collapseOffcanvas")}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{t("prefs.contentLayout")}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={preferences.contentLayout}
                onValueChange={(value) => value && setPreference("contentLayout", value as never)}
              >
                <ToggleGroupItem value="full">{t("prefs.layoutFull")}</ToggleGroupItem>
                <ToggleGroupItem value="centered">{t("prefs.layoutCentered")}</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={resetPreferences}>
            {t("prefs.reset")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
