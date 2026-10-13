import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Field, FormSection } from "@/components/form";
import { Button, Checkbox, Input, Label, NativeSelect, NativeSelectOption } from "@/components/ui";
import type { CoachDraft } from "@/features/coaches";
import type { LookupEntry } from "@/features/lookups";
import { useFormatters, useTranslation, type TranslationKey } from "@/i18n";

import { newCertificate, newEducation, newExperience, newSkill, type BackgroundOptions } from "./background";
import { NumberField } from "./form-inputs";

type Background = Pick<CoachDraft, "educations" | "certificates" | "experiences" | "skills">;
type Errors = Readonly<Record<string, string>> | undefined;

/** A repeatable list of entries, laid out like the packages above it. */
function EntryList<T extends { readonly id: string }>({
  entries,
  entryLabel,
  removeLabel,
  emptyLabel,
  addLabel,
  onAdd,
  onRemove,
  children,
}: {
  entries: readonly T[];
  entryLabel: (index: number) => string;
  removeLabel: (index: number) => string;
  emptyLabel: string;
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  children: (entry: T, index: number) => ReactNode;
}) {
  return (
    <>
      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {entries.map((entry, index) => (
            <li key={entry.id} className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{entryLabel(index)}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={removeLabel(index)}
                  onClick={() => onRemove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
              {children(entry, index)}
            </li>
          ))}
        </ol>
      )}
      <Button type="button" variant="outline" className="mt-4" onClick={onAdd}>
        <Plus /> {addLabel}
      </Button>
    </>
  );
}

function TextField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  maxLength,
  dir = "auto",
  type = "text",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  required?: boolean;
  maxLength: number;
  dir?: "auto" | "ltr";
  type?: "text" | "url";
}) {
  return (
    <Field name={name} label={label} error={error} required={required}>
      {(props) => (
        <Input
          {...props}
          type={type}
          dir={dir}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

function DateField({
  name,
  label,
  value,
  onChange,
  disabled,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field name={name} label={label}>
      {(props) => (
        <Input
          {...props}
          type="date"
          dir="ltr"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

function LookupField({
  name,
  label,
  value,
  onChange,
  entries,
  error,
  required,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  entries: readonly LookupEntry[];
  error?: string;
  required?: boolean;
}) {
  const { t } = useTranslation();
  const { text } = useFormatters();
  return (
    <Field name={name} label={label} error={error} required={required}>
      {(props) => (
        <NativeSelect {...props} value={value} onChange={(event) => onChange(event.target.value)}>
          <NativeSelectOption value="">{t("people.choose")}</NativeSelectOption>
          {entries.map((entry) => (
            <NativeSelectOption key={entry.id} value={entry.id}>
              {text({ en: entry.nameEn, ar: entry.nameAr })}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}
    </Field>
  );
}

function CheckField({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <Checkbox id={`field-${name}`} checked={checked} onCheckedChange={(next) => onChange(next === true)} />
      <Label htmlFor={`field-${name}`} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

const replaceAt = <T,>(list: readonly T[], index: number, next: T) =>
  list.map((entry, position) => (position === index ? next : entry));
const removeAt = <T,>(list: readonly T[], index: number) => list.filter((_, position) => position !== index);

/**
 * Education, certificates, work experience and skills: the coach's background,
 * shown only while adding a coach. The live API takes these lists with the new
 * coach but never returns them, so an edit form could only overwrite them blind.
 */
export function CoachBackgroundSections({
  value,
  onChange,
  options,
  errors,
}: {
  value: Background;
  onChange: (patch: Partial<Background>) => void;
  options: BackgroundOptions;
  errors: Errors;
}) {
  const { t } = useTranslation();
  const educations = value.educations ?? [];
  const certificates = value.certificates ?? [];
  const experiences = value.experiences ?? [];
  const skills = value.skills ?? [];
  const numbered = (key: TranslationKey) => (index: number) => t(key, { number: String(index + 1) });

  return (
    <>
      <FormSection title={t("coaches.educations")} description={t("coaches.backgroundHint")}>
        <EntryList
          entries={educations}
          entryLabel={numbered("coaches.education")}
          removeLabel={numbered("coaches.removeEducation")}
          emptyLabel={t("coaches.noEducations")}
          addLabel={t("coaches.addEducation")}
          onAdd={() => onChange({ educations: [...educations, newEducation()] })}
          onRemove={(index) => onChange({ educations: removeAt(educations, index) })}
        >
          {(entry, index) => {
            const key = `educations.${index}`;
            const set = (next: Partial<typeof entry>) =>
              onChange({ educations: replaceAt(educations, index, { ...entry, ...next }) });
            return (
              <>
                <TextField
                  name={`${key}.schoolName`}
                  label={t("coaches.schoolName")}
                  value={entry.schoolName}
                  onChange={(schoolName) => set({ schoolName })}
                  error={errors?.[`${key}.schoolName`]}
                  maxLength={100}
                  required
                />
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <LookupField
                    name={`${key}.academicDegreeId`}
                    label={t("coaches.academicDegree")}
                    value={entry.academicDegreeId}
                    onChange={(academicDegreeId) => set({ academicDegreeId })}
                    entries={options.academicDegrees}
                    error={errors?.[`${key}.academicDegreeId`]}
                  />
                  <LookupField
                    name={`${key}.universityMajorId`}
                    label={t("coaches.universityMajor")}
                    value={entry.universityMajorId}
                    onChange={(universityMajorId) => set({ universityMajorId })}
                    entries={options.universityMajors}
                    error={errors?.[`${key}.universityMajorId`]}
                  />
                  <DateField
                    name={`${key}.startDate`}
                    label={t("coaches.startDate")}
                    value={entry.startDate}
                    onChange={(startDate) => set({ startDate })}
                  />
                  <DateField
                    name={`${key}.endDate`}
                    label={t("coaches.endDate")}
                    value={entry.endDate}
                    onChange={(endDate) => set({ endDate })}
                    disabled={entry.isStillEducation}
                  />
                </div>
                <CheckField
                  name={`${key}.isStillEducation`}
                  label={t("coaches.stillStudying")}
                  checked={entry.isStillEducation}
                  onChange={(isStillEducation) => set({ isStillEducation, ...(isStillEducation ? { endDate: "" } : {}) })}
                />
              </>
            );
          }}
        </EntryList>
      </FormSection>

      <FormSection title={t("coaches.certificates")}>
        <EntryList
          entries={certificates}
          entryLabel={numbered("coaches.certificate")}
          removeLabel={numbered("coaches.removeCertificate")}
          emptyLabel={t("coaches.noCertificates")}
          addLabel={t("coaches.addCertificate")}
          onAdd={() => onChange({ certificates: [...certificates, newCertificate()] })}
          onRemove={(index) => onChange({ certificates: removeAt(certificates, index) })}
        >
          {(entry, index) => {
            const key = `certificates.${index}`;
            const set = (next: Partial<typeof entry>) =>
              onChange({ certificates: replaceAt(certificates, index, { ...entry, ...next }) });
            return (
              <div className="grid gap-x-4 sm:grid-cols-2">
                <TextField
                  name={`${key}.certificateName`}
                  label={t("coaches.certificateName")}
                  value={entry.certificateName}
                  onChange={(certificateName) => set({ certificateName })}
                  error={errors?.[`${key}.certificateName`]}
                  maxLength={100}
                  required
                />
                <TextField
                  name={`${key}.organizationName`}
                  label={t("coaches.organizationName")}
                  value={entry.organizationName}
                  onChange={(organizationName) => set({ organizationName })}
                  error={errors?.[`${key}.organizationName`]}
                  maxLength={100}
                  required
                />
                <TextField
                  name={`${key}.credentialId`}
                  label={t("coaches.credentialId")}
                  value={entry.credentialId}
                  onChange={(credentialId) => set({ credentialId })}
                  error={errors?.[`${key}.credentialId`]}
                  maxLength={100}
                  dir="ltr"
                  required
                />
                <TextField
                  name={`${key}.credentialUrl`}
                  label={t("coaches.credentialUrl")}
                  value={entry.credentialUrl}
                  onChange={(credentialUrl) => set({ credentialUrl })}
                  error={errors?.[`${key}.credentialUrl`]}
                  maxLength={500}
                  dir="ltr"
                  type="url"
                />
                <DateField
                  name={`${key}.issuedDate`}
                  label={t("coaches.issuedDate")}
                  value={entry.issuedDate}
                  onChange={(issuedDate) => set({ issuedDate })}
                />
                <DateField
                  name={`${key}.expiryDate`}
                  label={t("coaches.expiryDate")}
                  value={entry.expiryDate}
                  onChange={(expiryDate) => set({ expiryDate })}
                />
                <Field
                  name={`${key}.certificateFile`}
                  label={t("coaches.certificateFile")}
                  hint={t("coaches.certificateFileHint")}
                  className="sm:col-span-2"
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="file"
                      onChange={(event) => set({ certificateFile: event.target.files?.[0] })}
                    />
                  )}
                </Field>
              </div>
            );
          }}
        </EntryList>
      </FormSection>

      <FormSection title={t("coaches.experiences")}>
        <EntryList
          entries={experiences}
          entryLabel={numbered("coaches.experience")}
          removeLabel={numbered("coaches.removeExperience")}
          emptyLabel={t("coaches.noExperiences")}
          addLabel={t("coaches.addExperience")}
          onAdd={() => onChange({ experiences: [...experiences, newExperience()] })}
          onRemove={(index) => onChange({ experiences: removeAt(experiences, index) })}
        >
          {(entry, index) => {
            const key = `experiences.${index}`;
            const set = (next: Partial<typeof entry>) =>
              onChange({ experiences: replaceAt(experiences, index, { ...entry, ...next }) });
            return (
              <>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  {/* `address` (300 characters, beside `companyAddress`) is read as the
                      job title: عنوان means both. Unconfirmed by the spec. */}
                  <TextField
                    name={`${key}.address`}
                    label={t("coaches.jobTitle")}
                    value={entry.address}
                    onChange={(address) => set({ address })}
                    error={errors?.[`${key}.address`]}
                    maxLength={300}
                    required
                  />
                  <LookupField
                    name={`${key}.jobTypeId`}
                    label={t("coaches.jobType")}
                    value={entry.jobTypeId}
                    onChange={(jobTypeId) => set({ jobTypeId })}
                    entries={options.jobTypes}
                    error={errors?.[`${key}.jobTypeId`]}
                  />
                  <TextField
                    name={`${key}.companyName`}
                    label={t("coaches.companyName")}
                    value={entry.companyName}
                    onChange={(companyName) => set({ companyName })}
                    error={errors?.[`${key}.companyName`]}
                    maxLength={100}
                    required
                  />
                  <TextField
                    name={`${key}.companyAddress`}
                    label={t("coaches.companyAddress")}
                    value={entry.companyAddress}
                    onChange={(companyAddress) => set({ companyAddress })}
                    error={errors?.[`${key}.companyAddress`]}
                    maxLength={100}
                    required
                  />
                  <DateField
                    name={`${key}.startDate`}
                    label={t("coaches.startDate")}
                    value={entry.startDate}
                    onChange={(startDate) => set({ startDate })}
                  />
                  <DateField
                    name={`${key}.endDate`}
                    label={t("coaches.endDate")}
                    value={entry.endDate}
                    onChange={(endDate) => set({ endDate })}
                    disabled={entry.isStillWorking}
                  />
                </div>
                <CheckField
                  name={`${key}.isStillWorking`}
                  label={t("coaches.stillWorking")}
                  checked={entry.isStillWorking}
                  onChange={(isStillWorking) => set({ isStillWorking, ...(isStillWorking ? { endDate: "" } : {}) })}
                />
              </>
            );
          }}
        </EntryList>
      </FormSection>

      <FormSection title={t("coaches.skills")}>
        <EntryList
          entries={skills}
          entryLabel={numbered("coaches.skill")}
          removeLabel={numbered("coaches.removeSkill")}
          emptyLabel={t("coaches.noSkills")}
          addLabel={t("coaches.addSkill")}
          onAdd={() => onChange({ skills: [...skills, newSkill()] })}
          onRemove={(index) => onChange({ skills: removeAt(skills, index) })}
        >
          {(entry, index) => {
            const key = `skills.${index}`;
            const set = (next: Partial<typeof entry>) =>
              onChange({ skills: replaceAt(skills, index, { ...entry, ...next }) });
            return (
              <div className="grid gap-x-4 sm:grid-cols-2">
                <LookupField
                  name={`${key}.courseId`}
                  label={t("coaches.skillCourse")}
                  value={entry.courseId}
                  onChange={(courseId) => set({ courseId })}
                  entries={options.courses}
                  error={errors?.[`${key}.courseId`]}
                  required
                />
                <NumberField
                  name={`${key}.percentageScore`}
                  label={t("coaches.percentageScore")}
                  value={entry.percentageScore}
                  onChange={(percentageScore) => set({ percentageScore })}
                  error={errors?.[`${key}.percentageScore`]}
                  required
                />
              </div>
            );
          }}
        </EntryList>
      </FormSection>
    </>
  );
}
