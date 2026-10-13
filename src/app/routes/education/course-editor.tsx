import { Loader2, Trash2 } from "lucide-react";
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
import type { AdminCoach } from "@/features/coaches";
import {
  COURSE_FORMATS,
  COURSE_LEVELS,
  educationAdminService,
  type AdminCourse,
  type CourseCategory,
  type CourseDraft,
  type CourseFormat,
  type CourseLevel,
} from "@/features/education";
import type { Sport } from "@/features/sports";
import { useAsyncAction, useUnsavedGuard } from "@/hooks";
import { useFormatters, useTranslation, type TranslationKey } from "@/i18n";

import { recordPath } from "../../record-paths";
import { bothLanguages, slugify } from "../coaches/form-helpers";
import { MoneyField, NumberField } from "../coaches/form-inputs";
import { FORMAT_LABEL, LEVEL_LABEL } from "./course-labels";

const blank = { en: "", ar: "" };
const unpriced = { amount: Number.NaN, currency: "JOD" as const };

/*
 * A new course starts with nothing chosen and, above all, NO PRICE. The client
 * has not confirmed prices or durations for the NCSF courses; a figure typed
 * here by default would reach a course page as if it were real. Format and
 * level start unchosen for the same reason — the service asks for them.
 */
const EMPTY: CourseDraft = {
  slug: "",
  title: blank,
  summary: blank,
  media: [],
  format: "" as CourseFormat,
  level: "" as CourseLevel,
  durationHours: Number.NaN,
  price: unpriced,
  compareAtPrice: undefined,
  categoryIds: [],
  sportIds: [],
  instructorIds: [],
  moduleCount: Number.NaN,
  certification: undefined,
  languages: [],
  venue: blank,
  nextIntake: { startsOn: "", seatsTotal: Number.NaN },
};

/** Languages of delivery on offer; any code already on a course is offered as well. */
const LANGUAGE_CODES = ["ar", "en"];

function toDraft(course: AdminCourse): CourseDraft {
  return {
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    media: course.media,
    format: course.format,
    level: course.level,
    durationHours: course.durationHours,
    price: course.price,
    compareAtPrice: course.compareAtPrice,
    categoryIds: course.categoryIds,
    sportIds: course.sportIds,
    instructorIds: course.instructorIds,
    moduleCount: course.moduleCount,
    certification: course.certification,
    languages: course.languages,
    venue: course.venue,
    nextIntake: { startsOn: course.nextIntake.startsOn, seatsTotal: course.nextIntake.seatsTotal },
  };
}

const hasVenue = (format: CourseFormat) => format === "in-person" || format === "hybrid";

/**
 * The course form: the same one adds a course (`course` null) and edits one.
 *
 * It edits a `CourseDraft`, so status, seat counts, enrolments and ratings are
 * out of its reach — publishing stays its own action, with its own rule. The
 * parent keys it by course id and does not remount it on refetch, so moving an
 * enrolment on the same page cannot throw away edits typed here.
 *
 * Laid out like every edit page: what the course is, its pictures, how it runs
 * and when it next starts on the main side; its price and where it is filed on
 * the side column. Pictures upload the moment they are chosen and are saved
 * with the rest of the course.
 */
export function CourseEditor({
  course,
  categories,
  sports,
  coaches,
  onSaved,
}: {
  course: AdminCourse | null;
  categories: readonly CourseCategory[];
  sports: readonly Sport[];
  coaches: readonly AdminCoach[];
  onSaved?: () => void;
}) {
  const { t, localeTag } = useTranslation();
  const { text } = useFormatters();
  const navigate = useNavigate();
  const notice = useNotice();
  const canWrite = usePermission("education:write");

  const [draft, setDraft] = useState<CourseDraft>(() => (course ? toDraft(course) : EMPTY));
  const [baseline, setBaseline] = useState<CourseDraft>(() => (course ? toDraft(course) : EMPTY));
  // A new course's address follows its English title until someone types one.
  const [slugTouched, setSlugTouched] = useState(course !== null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);

  const save = useAsyncAction(
    (input: CourseDraft) =>
      course ? educationAdminService.updateCourse(course.id, input) : educationAdminService.createCourse(input),
    {
      onSuccess: (saved) => {
        if (!course) {
          notice.success(t("crud.created", { noun: t("courses.noun") }));
          setLeaveTo(recordPath.course(saved.id));
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

  /* Leave only once a render has disarmed the guard — see the coach editor. */
  useEffect(() => {
    if (leaveTo) navigate(leaveTo, { replace: true });
  }, [leaveTo, navigate]);

  const set = <K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) => setDraft({ ...draft, [key]: value });
  /* An upload answers after the fact: merge into the draft as it is by then,
     keeping whatever was typed while it ran. */
  const setLater = <K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const languageName = (code: string) => new Intl.DisplayNames([localeTag], { type: "language" }).of(code) ?? code;
  const languageOptions = [...new Set([...LANGUAGE_CODES, ...draft.languages])].map((code) => ({
    value: code,
    label: languageName(code),
  }));
  const isPublished = course?.status === "published";

  const labels: Record<string, string> = {
    ...bothLanguages("title", t("field.title")),
    ...bothLanguages("summary", t("field.summary")),
    slug: t("field.slug"),
    media: t("courses.media"),
    format: t("courses.format"),
    level: t("courses.level"),
    durationHours: t("courses.durationHours"),
    moduleCount: t("courses.modules"),
    languages: t("coaches.languages"),
    ...bothLanguages("venue", t("courses.venue")),
    price: t("field.price"),
    compareAtPrice: t("courses.compareAtPrice"),
    categoryIds: t("field.categories"),
    sportIds: t("field.sports"),
    instructorIds: t("courses.instructors"),
    ...bothLanguages("certification.name", t("courses.certificationName")),
    ...bothLanguages("certification.issuedBy", t("courses.issuedBy")),
    "nextIntake.startsOn": t("courses.intakeDate"),
    "nextIntake.seatsTotal": t("courses.seats"),
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
              <FormSection title={t("courses.about")} description={course ? undefined : t("courses.newHint")}>
                <LocalizedField
                  name="title"
                  label={t("field.title")}
                  value={draft.title}
                  onChange={(title) =>
                    setDraft({ ...draft, title, ...(slugTouched ? {} : { slug: slugify(title.en) }) })
                  }
                  fieldErrors={errors}
                  required
                />
                <LocalizedField
                  name="summary"
                  label={t("field.summary")}
                  hint={t("courses.summaryHint")}
                  value={draft.summary}
                  onChange={(summary) => set("summary", summary)}
                  fieldErrors={errors}
                  multiline
                  required={isPublished}
                />
                <Field
                  name="slug"
                  label={t("field.slug")}
                  hint={t("field.slugHint")}
                  error={errors?.slug}
                  required
                  className="mb-0 sm:max-w-md"
                >
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
              </FormSection>

              <FormSection title={t("people.images")} description={t("courses.imagesHint")}>
                <ImageGalleryField
                  name="media"
                  label={t("courses.media")}
                  value={draft.media}
                  onChange={(media) => setLater("media", media)}
                  purpose="course"
                  max={12}
                  error={errors?.media}
                  disabled={!canWrite}
                />
              </FormSection>

              <FormSection title={t("courses.delivery")}>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Field name="format" label={t("courses.format")} error={errors?.format} required>
                    {(props) => (
                      <NativeSelect
                        {...props}
                        value={draft.format}
                        onChange={(event) => set("format", event.target.value as CourseFormat)}
                      >
                        <NativeSelectOption value="" disabled>
                          {t("people.choose")}
                        </NativeSelectOption>
                        {COURSE_FORMATS.map((format) => (
                          <NativeSelectOption key={format} value={format}>
                            {t(FORMAT_LABEL[format])}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    )}
                  </Field>
                  <Field name="level" label={t("courses.level")} error={errors?.level} required>
                    {(props) => (
                      <NativeSelect
                        {...props}
                        value={draft.level}
                        onChange={(event) => set("level", event.target.value as CourseLevel)}
                      >
                        <NativeSelectOption value="" disabled>
                          {t("people.choose")}
                        </NativeSelectOption>
                        {COURSE_LEVELS.map((level) => (
                          <NativeSelectOption key={level} value={level}>
                            {t(LEVEL_LABEL[level])}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    )}
                  </Field>
                  <NumberField
                    name="durationHours"
                    label={t("courses.durationHours")}
                    value={draft.durationHours}
                    onChange={(durationHours) => set("durationHours", durationHours)}
                    error={errors?.durationHours}
                    decimal
                    required
                  />
                  <NumberField
                    name="moduleCount"
                    label={t("courses.modules")}
                    value={draft.moduleCount}
                    onChange={(moduleCount) => set("moduleCount", moduleCount)}
                    error={errors?.moduleCount}
                    required
                  />
                </div>
                <CheckboxGroupField
                  name="languages"
                  legend={t("coaches.languages")}
                  required
                  error={errors?.languages}
                  options={languageOptions}
                  value={draft.languages}
                  onChange={(languages) => set("languages", languages)}
                  disabled={!canWrite}
                />
                {hasVenue(draft.format) ? (
                  <LocalizedField
                    name="venue"
                    label={t("courses.venue")}
                    hint={t("courses.venueHint")}
                    value={draft.venue ?? blank}
                    onChange={(venue) => set("venue", venue)}
                    fieldErrors={errors}
                    required
                  />
                ) : null}
                {/* With no coaches yet the group still renders — and keeps its id,
                    so an error on it can be jumped to from the summary. */}
                <CheckboxGroupField
                    name="instructorIds"
                    legend={t("courses.instructors")}
                    hint={t("courses.instructorsHint")}
                    columns={2}
                    error={errors?.instructorIds}
                    emptyLabel={t("courses.noCoaches")}
                    options={coaches.map((coach) => ({
                      value: coach.id,
                      label: text(coach.name),
                      note:
                        coach.verificationStatus === "approved"
                          ? undefined
                          : ((t(`statusLabel.${coach.verificationStatus}` as TranslationKey) as string | undefined) ??
                            coach.verificationStatus),
                    }))}
                    value={draft.instructorIds}
                    onChange={(instructorIds) => set("instructorIds", instructorIds)}
                    disabled={!canWrite}
                  />
              </FormSection>

              <FormSection title={t("courses.nextIntake")} description={t("courses.intakeHint")}>
                <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                  <Field
                    name="nextIntake.startsOn"
                    label={t("courses.intakeDate")}
                    error={errors?.["nextIntake.startsOn"]}
                    required
                    className="mb-0"
                  >
                    {(props) => (
                      <Input
                        {...props}
                        type="date"
                        dir="ltr"
                        value={draft.nextIntake.startsOn}
                        onChange={(event) => set("nextIntake", { ...draft.nextIntake, startsOn: event.target.value })}
                      />
                    )}
                  </Field>
                  <NumberField
                    name="nextIntake.seatsTotal"
                    label={t("courses.seats")}
                    value={draft.nextIntake.seatsTotal}
                    onChange={(seatsTotal) => set("nextIntake", { ...draft.nextIntake, seatsTotal })}
                    error={errors?.["nextIntake.seatsTotal"]}
                    required
                    className="mb-0"
                  />
                </div>
              </FormSection>

              <FormSection title={t("courses.certification")}>
                <UiField
                  orientation="horizontal"
                  className={`rounded-lg border p-3 ${draft.certification ? "mb-5" : ""}`}
                >
                  <FieldContent>
                    <FieldLabel htmlFor="field-certification">{t("courses.hasCertification")}</FieldLabel>
                    <FieldDescription>{t("courses.hasCertificationHint")}</FieldDescription>
                  </FieldContent>
                  <Switch
                    id="field-certification"
                    checked={Boolean(draft.certification)}
                    onCheckedChange={(checked) =>
                      set("certification", checked ? { name: blank, issuedBy: blank } : undefined)
                    }
                  />
                </UiField>
                {draft.certification ? (
                  <>
                    <LocalizedField
                      name="certification.name"
                      label={t("courses.certificationName")}
                      value={draft.certification.name}
                      onChange={(name) => set("certification", { ...draft.certification!, name })}
                      fieldErrors={errors}
                      required
                    />
                    <LocalizedField
                      name="certification.issuedBy"
                      label={t("courses.issuedBy")}
                      value={draft.certification.issuedBy}
                      onChange={(issuedBy) => set("certification", { ...draft.certification!, issuedBy })}
                      fieldErrors={errors}
                      required
                    />
                  </>
                ) : null}
              </FormSection>
            </div>

            <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-16">
              <FormSection title={t("section.pricing")} description={t("section.pricingHint")}>
                <MoneyField
                  name="price"
                  label={t("field.price")}
                  hint={t("courses.priceHint")}
                  value={draft.price}
                  onChange={(price) => set("price", price ?? unpriced)}
                  error={errors?.price}
                  required
                />
                <MoneyField
                  name="compareAtPrice"
                  label={t("courses.compareAtPrice")}
                  hint={t("courses.compareAtHint")}
                  value={draft.compareAtPrice}
                  onChange={(compareAtPrice) => set("compareAtPrice", compareAtPrice)}
                  error={errors?.compareAtPrice}
                  className="mb-0"
                />
              </FormSection>

              <FormSection title={t("courses.filedUnder")} description={t("section.organisationHint")}>
                <CheckboxGroupField
                  name="categoryIds"
                  legend={t("field.categories")}
                  required
                  columns={2}
                  error={errors?.categoryIds}
                  options={categories.map((category) => ({ value: category.id, label: text(category.name) }))}
                  value={draft.categoryIds}
                  onChange={(categoryIds) => set("categoryIds", categoryIds)}
                  disabled={!canWrite}
                />
                <CheckboxGroupField
                  name="sportIds"
                  legend={t("field.sports")}
                  columns={2}
                  error={errors?.sportIds}
                  options={sports.map((sport) => ({ value: sport.id, label: text(sport.name) }))}
                  value={draft.sportIds ?? []}
                  onChange={(sportIds) => set("sportIds", sportIds)}
                  disabled={!canWrite}
                />
              </FormSection>
            </div>
          </div>
        </fieldset>

        {canWrite ? (
          <FormActions
            start={
              course ? (
                <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 /> {t("crud.delete")}
                </Button>
              ) : null
            }
          >
            <Button type="button" variant="outline" onClick={() => navigate("/education/courses")}>
              {t("action.cancel")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {save.isPending ? t("action.saving") : course ? t("action.save") : t("crud.create")}
            </Button>
          </FormActions>
        ) : null}
      </form>

      {course ? (
        <ConfirmDialog
          open={confirmingDelete}
          onOpenChange={setConfirmingDelete}
          title={t("crud.deleteTitle", { name: text(course.title) })}
          description={t("courses.deleteBody")}
          onConfirm={async () => {
            await educationAdminService.deleteCourse(course.id);
            notice.success(t("crud.deleted", { name: text(course.title) }));
            setLeaveTo("/education/courses");
          }}
        />
      ) : null}
    </>
  );
}
