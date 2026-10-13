/** SEO fields the admin edits and the storefront consumes. */
export interface SeoMeta {
  readonly title?: string;
  readonly description?: string;
  readonly ogImageUrl?: string;
  readonly canonicalPath?: string;
  readonly noIndex?: boolean;
}
