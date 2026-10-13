import { Check, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { Field, FormActions, FormError } from "@/components/form";
import { Badge, Button, Input, NativeSelect, NativeSelectOption } from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  THEME_COLOR_KEYS,
  contrastRatio,
  settingsService,
  type StorefrontTheme,
  type ThemeColors,
  type ThemeDraft,
} from "@/features/settings";
import { useAsyncAction } from "@/hooks";
import { useFormatters, useTranslation, type TranslationKey } from "@/i18n";

import { Section } from "../../components/record-parts";

/**
 * The storefront theme, edited as the storefront applies it.
 *
 * The preview is not a picture of the site; it is a small piece of the site's
 * own vocabulary — a dark hero band, a sheared primary button, a card on the
 * muted surface — drawn with the draft values, so a change can be judged before
 * it is saved. Contrast is shown live for the four pairings the service checks,
 * so the reason a save will be refused is visible while typing.
 */
function toDraft(theme: StorefrontTheme): ThemeDraft {
  const { id: _id, audit: _audit, ...draft } = theme;
  return draft;
}

export function ThemeEditor({ theme, onSaved }: { theme: StorefrontTheme; onSaved: () => void }) {
  const { t } = useTranslation();
  const { dateTime } = useFormatters();
  const canWrite = usePermission("settings:write");
  const [draft, setDraft] = useState<ThemeDraft>(() => toDraft(theme));

  const save = useAsyncAction((next: ThemeDraft) => settingsService.updateTheme(next), {
    onSuccess: onSaved,
  });
  const reset = useAsyncAction(() => settingsService.resetTheme(), {
    onSuccess: (fresh) => {
      setDraft(toDraft(fresh));
      onSaved();
    },
  });

  const setColor = (key: keyof ThemeColors, value: string) =>
    setDraft((current) => ({ ...current, colors: { ...current.colors, [key]: value } }));

  const pairs = [
    ["onPrimary", "primary"],
    ["onSecondary", "secondary"],
    ["body", "surface"],
    ["title", "surface"],
  ] as const;

  const { colors } = draft;
  const skew = draft.shape.skew;
  const preview: CSSProperties = { fontFamily: draft.typography.fontFamily };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save.run(draft);
      }}
    >
      <FormError error={save.error ?? reset.error} />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Section id="colours" title={t("settings.colours")} description={t("settings.coloursHint")}>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {THEME_COLOR_KEYS.map((key) => (
                <Field
                  key={key}
                  name={`colors.${key}`}
                  label={t(`theme.${key}` as TranslationKey)}
                  error={save.fieldErrors?.[`colors.${key}`]}
                >
                  {(props) => (
                    <div className="flex items-center gap-2">
                      {/* The swatch is the browser's colour picker under a painted
                          square; the hex box beside it is the labelled control. */}
                      <span
                        className="relative size-8 shrink-0 overflow-hidden rounded-lg border shadow-xs"
                        style={{ background: colors[key] }}
                      >
                        <input
                          type="color"
                          aria-hidden="true"
                          tabIndex={-1}
                          value={/^#[0-9a-f]{6}$/i.test(colors[key]) ? colors[key] : "#000000"}
                          onChange={(event) => setColor(key, event.target.value)}
                          className="absolute inset-0 size-full cursor-pointer opacity-0"
                        />
                      </span>
                      <Input
                        {...props}
                        dir="ltr"
                        value={colors[key]}
                        onChange={(event) => setColor(key, event.target.value)}
                        className="font-mono"
                      />
                    </div>
                  )}
                </Field>
              ))}
            </div>
          </Section>

          <Section id="type-shape" title={t("settings.typeAndShape")}>
            <div className="grid gap-x-6 sm:grid-cols-2">
              <Field name="typography.fontFamily" label={t("theme.fontFamily")} hint={t("theme.fontFamilyHint")} error={save.fieldErrors?.["typography.fontFamily"]}>
                {(props) => (
                  <Input {...props} dir="ltr" className="font-mono" value={draft.typography.fontFamily}
                    onChange={(event) => setDraft({ ...draft, typography: { ...draft.typography, fontFamily: event.target.value } })} />
                )}
              </Field>
              <Field name="typography.scale" label={t("theme.scale")} error={save.fieldErrors?.["typography.scale"]}>
                {(props) => (
                  <Input {...props} dir="ltr" className="font-mono" value={draft.typography.scale}
                    onChange={(event) => setDraft({ ...draft, typography: { ...draft.typography, scale: event.target.value } })} />
                )}
              </Field>
              <Field name="shape.skew" label={t("theme.skew")} hint={t("theme.skewHint")} error={save.fieldErrors?.["shape.skew"]}>
                {(props) => (
                  <Input {...props} dir="ltr" className="font-mono" value={draft.shape.skew}
                    onChange={(event) => setDraft({ ...draft, shape: { ...draft.shape, skew: event.target.value } })} />
                )}
              </Field>
              <Field name="shape.buttonRadius" label={t("theme.buttonRadius")}>
                {(props) => (
                  <Input {...props} dir="ltr" className="font-mono" value={draft.shape.buttonRadius}
                    onChange={(event) => setDraft({ ...draft, shape: { ...draft.shape, buttonRadius: event.target.value } })} />
                )}
              </Field>
              <Field name="layout.maxWidth" label={t("theme.maxWidth")}>
                {(props) => (
                  <Input {...props} dir="ltr" className="font-mono" value={draft.layout.maxWidth}
                    onChange={(event) => setDraft({ ...draft, layout: { ...draft.layout, maxWidth: event.target.value } })} />
                )}
              </Field>
              <Field name="layout.headerMode" label={t("theme.headerMode")}>
                {(props) => (
                  <NativeSelect {...props} value={draft.layout.headerMode}
                    onChange={(event) => setDraft({ ...draft, layout: { ...draft.layout, headerMode: event.target.value as "fixed" | "static" } })}>
                    <NativeSelectOption value="fixed">{t("theme.headerFixed")}</NativeSelectOption>
                    <NativeSelectOption value="static">{t("theme.headerStatic")}</NativeSelectOption>
                  </NativeSelect>
                )}
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <Section id="preview" title={t("settings.preview")} description={t("settings.previewHint")}>
            <div style={preview} className="overflow-hidden rounded-lg border" dir="auto">
              <div className="p-6" style={{ background: colors.secondary, color: colors.onSecondary }}>
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: colors.accent }}>
                  JoFit
                </p>
                <p className="mt-2 text-xl" style={{ fontWeight: Number(draft.typography.titleWeight) || 700 }}>
                  {t("settings.previewHeadline")}
                </p>
                <span
                  className="mt-4 inline-block px-5 py-2 text-sm font-semibold"
                  style={{
                    background: colors.primary,
                    color: colors.onPrimary,
                    transform: `skewX(${skew})`,
                    borderRadius: draft.shape.buttonRadius,
                  }}
                >
                  <span className="inline-block" style={{ transform: `skewX(calc(${skew} * -1))` }}>
                    {t("settings.previewButton")}
                  </span>
                </span>
              </div>
              <div className="p-6" style={{ background: colors.surfaceMuted }}>
                <div className="border p-4" style={{ background: colors.surface, borderColor: colors.border }}>
                  <p className="font-semibold" style={{ color: colors.title }}>
                    {t("settings.previewCard")}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: colors.body }}>
                    {t("settings.previewBody")}
                  </p>
                  <p className="mt-2 text-sm font-medium" style={{ color: colors.primaryDark }}>
                    {t("settings.previewLink")}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section id="contrast" title={t("settings.contrast")} description={t("settings.contrastHint")}>
            <ul className="divide-y text-sm">
              {pairs.map(([fg, bg]) => {
                const ratio = contrastRatio(colors[fg], colors[bg]);
                const ok = ratio !== undefined && ratio >= 4.5;
                return (
                  <li key={fg + bg} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-flex size-6 items-center justify-center rounded-md border text-[0.7rem] font-bold"
                        style={{ background: colors[bg], color: colors[fg] }}
                      >
                        Aa
                      </span>
                      {`${t(`theme.${fg}` as TranslationKey)} / ${t(`theme.${bg}` as TranslationKey)}`}
                    </span>
                    <Badge variant={ok ? "secondary" : "destructive"}>
                      {ok ? <Check aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
                      <span data-figure>{ratio === undefined ? "—" : `${ratio.toFixed(2)}:1`}</span>
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </Section>

          <p className="text-xs text-muted-foreground">{t("settings.notLive")}</p>
        </div>
      </div>

      <FormActions
        start={
          <p className="text-xs text-muted-foreground">
            {t("settings.lastSaved", { date: dateTime(theme.audit.updatedAt) })}
          </p>
        }
      >
        <Button type="button" variant="outline" disabled={!canWrite || reset.isPending} onClick={() => void reset.run(undefined)}>
          {reset.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
          {t("settings.reset")}
        </Button>
        <Button type="submit" disabled={!canWrite || save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {save.isPending ? t("action.saving") : t("action.save")}
        </Button>
      </FormActions>
    </form>
  );
}
