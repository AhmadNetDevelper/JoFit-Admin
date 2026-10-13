import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ConfirmDialog } from "@/components/crud";
import { useNotice } from "@/components/feedback";
import {
  CheckboxGroupField,
  Field,
  FormActions,
  FormError,
  FormSection,
  ImageField,
  ImageGalleryField,
  LocalizedField,
  UnsavedDialog,
} from "@/components/form";
import {
  Button,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
  Switch,
  Field as UiField,
} from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  COACH_SESSION_MODES,
  coachesAdminService,
  type AdminCoach,
  type CoachDraft,
  type CoachPackage,
  type CoachSessionMode,
  type CoachSpecialisation,
} from "@/features/coaches";
import type { Sport } from "@/features/sports";
import { useAsyncAction, useUnsavedGuard } from "@/hooks";
import { useFormatters, useTranslation, type TranslationKey } from "@/i18n";
import type { Location } from "@/types";

import { recordPath } from "../../record-paths";
import { backgroundLabels, type BackgroundOptions } from "./background";
import { CoachBackgroundSections } from "./coach-background";
import { bothLanguages, slugify } from "./form-helpers";
import { MoneyField, NumberField } from "./form-inputs";

const blank = { en: "", ar: "" };

/*
 * A new profile starts empty rather than "sensibly" pre-filled: years of
 * experience, a reply-time promise and the languages someone coaches in are
 * facts about a real person, and a default would be saved as if they had said it.
 */
const EMPTY: CoachDraft = {
  slug: "",
  name: blank,
  email: "",
  headline: blank,
  bio: blank,
  userName: "",
  phoneNumber: "",
  password: "",
  educations: [],
  certificates: [],
  experiences: [],
  skills: [],
  avatar: undefined,
  gallery: [],
  sportIds: [],
  specializations: [],
  yearsOfExperience: Number.NaN,
  languages: [],
  locationId: "",
  isRemoteAvailable: false,
  sessionRate: undefined,
  packages: [],
  responseTimeHours: Number.NaN,
};

/** Languages offered on a profile. Any code already on a coach is offered as well. */
const LANGUAGE_CODES = ["ar", "en", "fr", "tr", "de", "es", "ru", "it"];

const MODE_LABEL: Readonly<Record<CoachSessionMode, TranslationKey>> = {
  "in-person": "coaches.mode.in-person",
  online: "coaches.mode.online",
};

function toDraft(coach: AdminCoach): CoachDraft {
  return {
    slug: coach.slug,
    name: coach.name,
    email: coach.email,
    headline: coach.headline,
    bio: coach.bio ?? blank,
    // Never returned by the API; blank keeps what is stored.
    userName: "",
    phoneNumber: "",
    avatar: coach.avatar,
    gallery: coach.gallery,
    sportIds: coach.sportIds,
    specializations: coach.specializations,
    yearsOfExperience: coach.yearsOfExperience,
    languages: coach.languages,
    locationId: coach.location.id,
    isRemoteAvailable: coach.isRemoteAvailable,
    sessionRate: coach.sessionRate,
    packages: coach.packages,
    responseTimeHours: coach.responseTimeHours,
  };
}

/**
 * The profile form: the same one adds a coach (`coach` null) and edits one.
 *
 * It edits a `CoachDraft` — the profile, the login and the packages, plus the
 * background for a new coach — so saving can never touch verification,
 * certifications or the coach's record on the platform.
 * The parent keys it by coach id and does not remount it on refetch, so a
 * certification toggled further down the page cannot throw away edits typed
 * here.
 *
 * Laid out like every edit page: who the coach is, their photos, their working
 * details and what they sell on the main side; their portrait and where they
 * are filed on the side column. Pictures upload the moment they are chosen and
 * are saved with the rest of the profile.
 */
export function CoachEditor({
  coach,
  sports,
  specialisations,
  locations,
  background,
  onSaved,
}: {
  coach: AdminCoach | null;
  sports: readonly Sport[];
  specialisations: readonly CoachSpecialisation[];
  locations: readonly Location[];
  /** The reference tables for the background sections, which only a new coach has. */
  background?: BackgroundOptions;
  onSaved?: () => void;
}) {
  const { t, localeTag } = useTranslation();
  const { text } = useFormatters();
  const navigate = useNavigate();
  const notice = useNotice();
  const canWrite = usePermission("coaches:write");

  const [draft, setDraft] = useState<CoachDraft>(() => (coach ? toDraft(coach) : EMPTY));
  const [baseline, setBaseline] = useState<CoachDraft>(() => (coach ? toDraft(coach) : EMPTY));
  // A new coach's address follows their English name until someone types one.
  const [slugTouched, setSlugTouched] = useState(coach !== null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);

  const save = useAsyncAction(
    (input: CoachDraft) =>
      coach ? coachesAdminService.updateCoach(coach.id, input) : coachesAdminService.createCoach(input),
    {
      onSuccess: (saved) => {
        if (!coach) {
          notice.success(t("crud.created", { noun: t("coaches.noun") }));
          setLeaveTo(recordPath.coach(saved.id));
          return;
        }
        const next = toDraft(saved);
        setDraft(next);
        setBaseline(next);
        notice.success(t("crud.updated"));
        onSaved?.();
      },
    },
  );

  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const blocker = useUnsavedGuard(isDirty && !save.isPending && leaveTo === null);

  /*
   * Navigating straight from the save or delete handler would meet the guard as
   * it was on the last render — still armed, so it would ask "discard changes?"
   * about a record that was just saved or deleted. Setting `leaveTo` renders
   * once with the guard off; this effect, declared after it, then leaves.
   */
  useEffect(() => {
    if (leaveTo) navigate(leaveTo, { replace: true });
  }, [leaveTo, navigate]);

  const set = <K extends keyof CoachDraft>(key: K, value: CoachDraft[K]) => setDraft({ ...draft, [key]: value });
  /* An upload answers after the fact, so it merges into the draft as it is by
     then — not as it was when the file was picked — and keeps what was typed
     meanwhile. */
  const setLater = <K extends keyof CoachDraft>(key: K, value: CoachDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const setPackage = (index: number, next: CoachPackage) =>
    set("packages", draft.packages.map((entry, position) => (position === index ? next : entry)));
  const addPackage = () =>
    set("packages", [
      ...draft.packages,
      {
        id: `pkg-${crypto.randomUUID().slice(0, 8)}`,
        name: blank,
        durationMinutes: Number.NaN,
        sessionCount: 1,
        mode: "in-person",
        price: { amount: Number.NaN, currency: "JOD" },
      },
    ]);

  const languageName = (code: string) => new Intl.DisplayNames([localeTag], { type: "language" }).of(code) ?? code;
  const languageOptions = [...new Set([...LANGUAGE_CODES, ...draft.languages])].map((code) => ({
    value: code,
    label: languageName(code),
  }));

  const packageLabel = (index: number) => t("coaches.package", { number: String(index + 1) });
  const labels: Record<string, string> = {
    ...bothLanguages("name", t("field.name")),
    ...bothLanguages("headline", t("coaches.headline")),
    ...bothLanguages("bio", t("coaches.bio")),
    slug: t("field.slug"),
    email: t("field.email"),
    userName: t("coaches.userName"),
    password: t("coaches.password"),
    phoneNumber: t("field.phone"),
    avatar: t("coaches.avatar"),
    gallery: t("coaches.gallery"),
    locationId: t("field.location"),
    yearsOfExperience: t("coaches.yearsOfExperience"),
    responseTimeHours: t("coaches.responseTimeHours"),
    sessionRate: t("coaches.sessionRate"),
    sportIds: t("field.sports"),
    specializations: t("coaches.specialisations"),
    languages: t("coaches.languages"),
    ...Object.fromEntries(
      draft.packages.flatMap((_, index) => {
        const prefix = `${packageLabel(index)} — `;
        return [
          ...Object.entries(bothLanguages(`packages.${index}.name`, `${prefix}${t("coaches.packageName")}`)),
          [`packages.${index}.durationMinutes`, `${prefix}${t("coaches.durationMinutes")}`],
          [`packages.${index}.sessionCount`, `${prefix}${t("coaches.sessionCount")}`],
          [`packages.${index}.mode`, `${prefix}${t("coachBookings.mode")}`],
          [`packages.${index}.price`, `${prefix}${t("field.price")}`],
          [`packages.${index}.compareAtPrice`, `${prefix}${t("coaches.compareAtPrice")}`],
        ];
      }),
    ),
    ...backgroundLabels(t, draft),
  };
  const errors = save.fieldErrors;

  return (
    <>
      <UnsavedDialog blocker={blocker} />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.run(draft);
        }}
      >
        <FormError error={save.error} labels={labels} />

        {/* Disabled as a whole for a role that may only read. */}
        <fieldset disabled={!canWrite} className="min-w-0">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <FormSection title={t("coaches.profile")} description={coach ? undefined : t("coaches.newHint")}>
                <LocalizedField
                  name="name"
                  label={t("field.name")}
                  value={draft.name}
                  onChange={(name) => setDraft({ ...draft, name, ...(slugTouched ? {} : { slug: slugify(name.en) }) })}
                  fieldErrors={errors}
                  required
                />
                <LocalizedField
                  name="headline"
                  label={t("coaches.headline")}
                  hint={t("coaches.headlineHint")}
                  value={draft.headline}
                  onChange={(headline) => set("headline", headline)}
                  fieldErrors={errors}
                  required
                />
                <LocalizedField
                  name="bio"
                  label={t("coaches.bio")}
                  hint={t("coaches.bioHint")}
                  value={draft.bio ?? blank}
                  onChange={(bio) => set("bio", bio)}
                  fieldErrors={errors}
                  multiline
                />
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Field name="slug" label={t("field.slug")} hint={t("field.slugHint")} error={errors?.slug} required>
                    {(props) => (
                      <Input
                        {...props}
                        dir="ltr"
                        className="font-mono text-[0.8rem]"
                        value={draft.slug}
                        onChange={(event) => {
                          setSlugTouched(true);
                          set("slug", event.target.value.toLowerCase());
                        }}
                      />
                    )}
                  </Field>
                  <Field name="email" label={t("field.email")} error={errors?.email} required>
                    {(props) => (
                      <Input
                        {...props}
                        type="email"
                        dir="ltr"
                        autoComplete="off"
                        value={draft.email}
                        onChange={(event) => set("email", event.target.value)}
                      />
                    )}
                  </Field>
                </div>
              </FormSection>

              <FormSection
                title={t("coaches.login")}
                description={coach ? t("coaches.loginEditHint") : t("coaches.loginHint")}
              >
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Field
                    name="userName"
                    label={t("coaches.userName")}
                    hint={t("coaches.userNameHint")}
                    error={errors?.userName}
                    required={!coach}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        dir="ltr"
                        autoComplete="off"
                        maxLength={256}
                        value={draft.userName}
                        onChange={(event) => set("userName", event.target.value)}
                      />
                    )}
                  </Field>
                  {/* Shown as typed: staff read it out or copy it to the coach. */}
                  {coach ? null : (
                    <Field
                      name="password"
                      label={t("coaches.password")}
                      hint={t("coaches.passwordHint")}
                      error={errors?.password}
                      required
                    >
                      {(props) => (
                        <Input
                          {...props}
                          dir="ltr"
                          autoComplete="off"
                          spellCheck={false}
                          maxLength={256}
                          value={draft.password ?? ""}
                          onChange={(event) => set("password", event.target.value)}
                        />
                      )}
                    </Field>
                  )}
                  <Field
                    name="phoneNumber"
                    label={t("field.phone")}
                    hint={coach ? undefined : t("coaches.phoneHint")}
                    error={errors?.phoneNumber}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        type="tel"
                        dir="ltr"
                        autoComplete="off"
                        maxLength={256}
                        value={draft.phoneNumber}
                        onChange={(event) => set("phoneNumber", event.target.value)}
                      />
                    )}
                  </Field>
                </div>
              </FormSection>

              <FormSection title={t("people.images")} description={t("coaches.imagesHint")}>
                <ImageGalleryField
                  name="gallery"
                  label={t("coaches.gallery")}
                  value={draft.gallery}
                  onChange={(gallery) => setLater("gallery", gallery)}
                  purpose="coach-gallery"
                  max={12}
                  error={errors?.gallery}
                  disabled={!canWrite}
                />
              </FormSection>

              <FormSection title={t("section.details")} description={t("coaches.detailsHint")}>
                <Field name="locationId" label={t("field.location")} error={errors?.locationId} required>
                  {(props) => (
                    <NativeSelect
                      {...props}
                      value={draft.locationId}
                      onChange={(event) => set("locationId", event.target.value)}
                    >
                      <NativeSelectOption value="">{t("coaches.chooseLocation")}</NativeSelectOption>
                      {locations.map((location) => (
                        <NativeSelectOption key={location.id} value={location.id}>
                          {[text(location.name), text(location.city)].filter(Boolean).join(", ")}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <UiField orientation="horizontal" className="mb-5 rounded-lg border p-3">
                  <FieldContent>
                    <FieldLabel htmlFor="field-isRemoteAvailable">{t("coaches.remote")}</FieldLabel>
                    <FieldDescription>{t("coaches.remoteHint")}</FieldDescription>
                  </FieldContent>
                  <Switch
                    id="field-isRemoteAvailable"
                    checked={draft.isRemoteAvailable}
                    onCheckedChange={(checked) => set("isRemoteAvailable", checked)}
                  />
                </UiField>
                <div className="grid gap-x-4 gap-y-5 sm:grid-cols-3">
                  <NumberField
                    name="yearsOfExperience"
                    label={t("coaches.yearsOfExperience")}
                    value={draft.yearsOfExperience}
                    onChange={(value) => set("yearsOfExperience", value)}
                    error={errors?.yearsOfExperience}
                    required
                    className="mb-0"
                  />
                  <NumberField
                    name="responseTimeHours"
                    label={t("coaches.responseTimeHours")}
                    hint={t("coaches.responseTimeHint")}
                    value={draft.responseTimeHours}
                    onChange={(value) => set("responseTimeHours", value)}
                    error={errors?.responseTimeHours}
                    required
                    className="mb-0"
                  />
                  <MoneyField
                    name="sessionRate"
                    label={t("coaches.sessionRate")}
                    hint={t("coaches.sessionRateHint")}
                    value={draft.sessionRate}
                    onChange={(value) => set("sessionRate", value)}
                    error={errors?.sessionRate}
                    className="mb-0"
                  />
                </div>
              </FormSection>

              <FormSection title={t("coaches.packages")} description={t("coaches.packagesHint")}>
                {draft.packages.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {t("coaches.noPackages")}
                  </p>
                ) : (
                  <ol className="flex flex-col gap-4">
                    {draft.packages.map((pkg, index) => (
                      <li key={pkg.id} className="rounded-xl border bg-muted/30 p-4">
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold">{packageLabel(index)}</h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={t("coaches.removePackage", { number: String(index + 1) })}
                            onClick={() => set("packages", draft.packages.filter((_, position) => position !== index))}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                        <LocalizedField
                          name={`packages.${index}.name`}
                          label={t("coaches.packageName")}
                          value={pkg.name}
                          onChange={(name) => setPackage(index, { ...pkg, name })}
                          fieldErrors={errors}
                          required
                        />
                        <div className="grid gap-x-4 sm:grid-cols-3">
                          <NumberField
                            name={`packages.${index}.durationMinutes`}
                            label={t("coaches.durationMinutes")}
                            value={pkg.durationMinutes}
                            onChange={(durationMinutes) => setPackage(index, { ...pkg, durationMinutes })}
                            error={errors?.[`packages.${index}.durationMinutes`]}
                            required
                          />
                          <NumberField
                            name={`packages.${index}.sessionCount`}
                            label={t("coaches.sessionCount")}
                            value={pkg.sessionCount}
                            onChange={(sessionCount) => setPackage(index, { ...pkg, sessionCount })}
                            error={errors?.[`packages.${index}.sessionCount`]}
                            required
                          />
                          <Field
                            name={`packages.${index}.mode`}
                            label={t("coachBookings.mode")}
                            error={errors?.[`packages.${index}.mode`]}
                            required
                          >
                            {(props) => (
                              <NativeSelect
                                {...props}
                                value={pkg.mode}
                                onChange={(event) =>
                                  setPackage(index, { ...pkg, mode: event.target.value as CoachSessionMode })
                                }
                              >
                                {COACH_SESSION_MODES.map((mode) => (
                                  <NativeSelectOption key={mode} value={mode}>
                                    {t(MODE_LABEL[mode])}
                                  </NativeSelectOption>
                                ))}
                              </NativeSelect>
                            )}
                          </Field>
                        </div>
                        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                          <MoneyField
                            name={`packages.${index}.price`}
                            label={t("field.price")}
                            value={pkg.price}
                            onChange={(price) =>
                              setPackage(index, { ...pkg, price: price ?? { amount: Number.NaN, currency: "JOD" } })
                            }
                            error={errors?.[`packages.${index}.price`]}
                            required
                            className="mb-0"
                          />
                          <MoneyField
                            name={`packages.${index}.compareAtPrice`}
                            label={t("coaches.compareAtPrice")}
                            hint={t("coaches.compareAtHint")}
                            value={pkg.compareAtPrice}
                            onChange={(compareAtPrice) => setPackage(index, { ...pkg, compareAtPrice })}
                            error={errors?.[`packages.${index}.compareAtPrice`]}
                            className="mb-0"
                          />
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
                <Button type="button" variant="outline" className="mt-4" onClick={addPackage}>
                  <Plus /> {t("coaches.addPackage")}
                </Button>
              </FormSection>

              {!coach && background ? (
                <CoachBackgroundSections
                  value={draft}
                  onChange={(patch) => setDraft({ ...draft, ...patch })}
                  options={background}
                  errors={errors}
                />
              ) : null}
            </div>

            {/* Not sticky, unlike other edit pages' side columns: with the photo on
                top it is taller than the window, and a sticky column that tall
                hides its last fields (the languages) until the page ends. */}
            <div className="flex min-w-0 flex-col gap-6">
              <FormSection title={t("coaches.photo")} description={t("coaches.photoHint")}>
                <ImageField
                  name="avatar"
                  label={t("coaches.avatar")}
                  hint={t("coaches.avatarHint")}
                  value={draft.avatar}
                  onChange={(avatar) => setLater("avatar", avatar)}
                  purpose="coach-avatar"
                  aspect="portrait"
                  error={errors?.avatar}
                  disabled={!canWrite}
                />
              </FormSection>

              <FormSection title={t("section.organisation")} description={t("section.organisationHint")}>
                <CheckboxGroupField
                  name="sportIds"
                  legend={t("field.sports")}
                  required
                  columns={2}
                  error={errors?.sportIds}
                  options={sports.map((sport) => ({ value: sport.id, label: text(sport.name) }))}
                  value={draft.sportIds}
                  onChange={(sportIds) => set("sportIds", sportIds)}
                  disabled={!canWrite}
                />
                <CheckboxGroupField
                  name="specializations"
                  legend={t("coaches.specialisations")}
                  columns={2}
                  error={errors?.specializations}
                  options={specialisations.map((entry) => ({ value: entry.id, label: text(entry.name) }))}
                  value={draft.specializations}
                  onChange={(specializations) => set("specializations", specializations)}
                  disabled={!canWrite}
                />
                <CheckboxGroupField
                  name="languages"
                  legend={t("coaches.languages")}
                  required
                  columns={2}
                  error={errors?.languages}
                  options={languageOptions}
                  value={draft.languages}
                  onChange={(languages) => set("languages", languages)}
                  disabled={!canWrite}
                />
              </FormSection>
            </div>
          </div>
        </fieldset>

        {canWrite ? (
          <FormActions
            start={
              coach ? (
                <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 /> {t("crud.delete")}
                </Button>
              ) : null
            }
          >
            <Button type="button" variant="outline" onClick={() => navigate("/coaches")}>
              {t("action.cancel")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {save.isPending ? t("action.saving") : coach ? t("action.save") : t("crud.create")}
            </Button>
          </FormActions>
        ) : null}
      </form>

      {coach ? (
        <ConfirmDialog
          open={confirmingDelete}
          onOpenChange={setConfirmingDelete}
          title={t("crud.deleteTitle", { name: text(coach.name) })}
          description={t("coaches.deleteBody")}
          onConfirm={async () => {
            await coachesAdminService.deleteCoach(coach.id);
            notice.success(t("crud.deleted", { name: text(coach.name) }));
            setLeaveTo("/coaches");
          }}
        />
      ) : null}
    </>
  );
}
