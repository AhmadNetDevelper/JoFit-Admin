import { useMemo } from "react";

import { formatDate, formatDateTime, formatMoney, localize } from "@/lib";
import type { LocalizedText, Money, PartialLocalizedText } from "@/types";

import { useTranslation } from "./use-translation";

export interface Formatters {
  money: (value: Money) => string;
  date: (value: string) => string;
  dateTime: (value: string) => string;
  number: (value: number) => string;
  /** Short weekday name for a day index, 0 = Sunday. */
  weekday: (dayIndex: number) => string;
  /** Short month name, e.g. "Sep" / "أيلول". */
  month: (value: Date) => string;
  /** "Monday 28 September" / "الاثنين 28 أيلول": a day named in full. */
  longDate: (value: Date) => string;
  /** Resolves a localized field for the active language. */
  text: (value: LocalizedText | PartialLocalizedText) => string;
  /** "Football, Fitness and Gym" — with the reader's own conjunction and commas. */
  list: (values: readonly string[]) => string;
}

/**
 * Locale-bound formatters.
 *
 * Without this, every screen would look up the BCP-47 tag itself and they would
 * drift — one showing Arabic-Indic digits, another Latin. Formatting is decided
 * once, in `LOCALE_TAGS`.
 */
export function useFormatters(): Formatters {
  const { locale, localeTag } = useTranslation();

  return useMemo<Formatters>(
    () => ({
      money: (value) => formatMoney(value, localeTag),
      date: (value) => formatDate(value, localeTag),
      dateTime: (value) => formatDateTime(value, localeTag),
      number: (value) => new Intl.NumberFormat(localeTag).format(value),
      /*
       * Weekday and month names are language data, not product copy: they are
       * not ours to translate, and `Intl` already knows them in every locale the
       * admin could grow into. Putting them in the dictionary would mean
       * maintaining a calendar by hand.
       *
       * 1970-01-04 was a Sunday, so adding the index gives that weekday.
       */
      weekday: (dayIndex) =>
        new Intl.DateTimeFormat(localeTag, { weekday: "short" }).format(
          new Date(Date.UTC(1970, 0, 4 + dayIndex)),
        ),
      month: (value) => new Intl.DateTimeFormat(localeTag, { month: "short" }).format(value),
      longDate: (value) =>
        new Intl.DateTimeFormat(localeTag, { weekday: "long", day: "numeric", month: "long" }).format(value),
      text: (value) => localize(value, locale),
      /* The conjunction and separator are language data too — an English comma
         inside an Arabic sentence is a visible bug. */
      list: (values) => new Intl.ListFormat(localeTag, { type: "conjunction" }).format(values),
    }),
    [locale, localeTag],
  );
}
