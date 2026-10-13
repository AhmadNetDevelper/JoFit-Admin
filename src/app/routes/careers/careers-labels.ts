import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  JOB_STATUSES,
  type ApplicationStatus,
  type EmployerKind,
  type EmployerSize,
  type EmployerVerificationStatus,
  type EmploymentType,
  type ExperienceLevel,
  type JobCity,
  type JobLanguage,
  type JobStatus,
  type SalaryRange,
  type StatusStep,
  type WorkMode,
} from "@/features/careers";
import { useFormatters, useTranslation } from "@/i18n";

/**
 * The careers screens' words for the marketplace's taxonomy — the same words
 * the storefront uses — and the list state they keep in the URL. Components
 * live in `careers-parts.tsx`.
 */
export function useCareersLabels() {
  const { t } = useTranslation();
  const { money } = useFormatters();

  return useMemo(
    () => ({
      jobStatus: (status: JobStatus) => t(`careers.jobStatus.${status}`),
      verification: (status: EmployerVerificationStatus) => t(`careers.verification.${status}`),
      appStatus: (status: ApplicationStatus) => t(`careers.appStatus.${status}`),
      kind: (kind: EmployerKind) => t(`careers.kind.${kind}`),
      size: (size: EmployerSize) => t(`careers.size.${size}`),
      employmentType: (type: EmploymentType) => t(`careers.type.${type}`),
      workMode: (mode: WorkMode) => t(`careers.mode.${mode}`),
      level: (level: ExperienceLevel) => t(`careers.level.${level}`),
      city: (city: JobCity) => t(`careers.city.${city}`),
      language: (language: JobLanguage) => t(`careers.lang.${language}`),
      by: (by: StatusStep["by"]) => t(`careers.by.${by}`),
      /** "JOD 550.000 – JOD 800.000 a month", "From JOD 8.000 an hour", or "Not given". */
      salary: (salary: SalaryRange | undefined) => {
        if (!salary || (!salary.min && !salary.max)) return t("careers.job.salaryNone");
        const period = t(`careers.salary.${salary.period}`);
        const range =
          salary.min && salary.max
            ? `${money(salary.min)} – ${money(salary.max)}`
            : salary.min
              ? t("careers.job.salaryFrom", { amount: money(salary.min) })
              : t("careers.job.salaryUpTo", { amount: money(salary.max!) });
        return `${range} ${period}`;
      },
    }),
    [t, money],
  );
}

/**
 * Single-value filters held in the URL beside the list's own state
 * (`?employer=emp-summit&category=jc-aquatics`). Changing one starts again at
 * page one; `next` may clear others in the same step (a new employer clears
 * the job chosen from the last one).
 */
export function useFilterParams<TKey extends string>(
  keys: readonly TKey[],
): [Readonly<Partial<Record<TKey, string>>>, (next: Readonly<Partial<Record<TKey, string | undefined>>>) => void] {
  const [params, setParams] = useSearchParams();
  /* A new object each render: callers read its strings (`values.employer`), which compare by value. */
  const values = Object.fromEntries(
    keys.flatMap((key) => {
      const value = params.get(key);
      return value ? [[key, value]] : [];
    }),
  ) as Partial<Record<TKey, string>>;
  const set = useCallback(
    (next: Readonly<Partial<Record<TKey, string | undefined>>>) => {
      const updated = new URLSearchParams(params);
      for (const [key, value] of Object.entries(next) as [TKey, string | undefined][]) {
        if (value) updated.set(key, value);
        else updated.delete(key);
      }
      updated.delete("page");
      setParams(updated, { replace: true });
    },
    [params, setParams],
  );
  return [values, set];
}

/**
 * The job queue's status chips, in the URL as `?status=a,b`. Unlike the other
 * lists it OPENS ON "Waiting for review" — that is the work — so no parameter
 * means `pending`, and clearing every chip is written `?status=all`.
 */
export function useJobStatusParam(): [readonly JobStatus[] | undefined, (next: readonly JobStatus[]) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get("status");
  const key = raw ?? "pending";
  const selected = useMemo(
    () =>
      key === "all"
        ? undefined
        : (key.split(",").filter((value) => (JOB_STATUSES as readonly string[]).includes(value)) as JobStatus[]),
    [key],
  );
  const set = useCallback(
    (next: readonly JobStatus[]) => {
      const updated = new URLSearchParams(params);
      updated.set("status", next.length > 0 ? next.join(",") : "all");
      updated.delete("page");
      setParams(updated, { replace: true });
    },
    [params, setParams],
  );
  return [selected && selected.length > 0 ? selected : undefined, set];
}

/** Hands a downloaded file to the browser to save, then lets the bytes go. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
