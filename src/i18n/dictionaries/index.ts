import type { Locale } from "../locales";
import { ar } from "./ar";
import { en, type Dictionary } from "./en";

export const dictionaries: Readonly<Record<Locale, Dictionary>> = { en, ar };

export type { Dictionary, TranslationKey } from "./en";
