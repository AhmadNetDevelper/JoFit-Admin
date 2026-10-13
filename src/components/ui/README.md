# Vendored: shadcn/ui

Every file in this directory except `count-up.tsx`, `list-card.tsx`,
`metric-card.tsx`, `page-header.tsx`, `search-input.tsx`, `status-badge.tsx`
and the `index.ts` barrel is copied from
[next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard)
by Mohammed Arham Khan, MIT licensed, and is kept **unchanged**.

Keeping them byte-identical is the point: it is what lets an upstream fix be
diffed back in, and it is why `.oxlintrc.json` turns off
`react/only-export-components` for this directory — the warning is about
`cva` variant maps that shadcn exports alongside its components, and editing
them to satisfy the linter would fork the files for no benefit.

**Do not restyle these.** A change this product needs goes in a component of its
own, built from these — the files listed above are exactly that. The JoFit look
is not a fork of these files either: it is the token values in
`src/styles/globals.css` (which every one of them reads) plus classes passed in
from the outside, as `admin-sidebar.tsx` does for the rail.

**Do not re-export `chart.tsx` from `index.ts`.** It imports recharts, and a
barrel is one module to the bundler: re-exporting it put recharts in the first
download of every screen. The dashboard imports it from its own path.

## The two deliberate deviations

Both are the same bug: upstream is written for a left-to-right product and uses
physical CSS where the admin needs logical. This admin is bilingual, so these
are corrected in place rather than worked around, and are listed here so an
upstream diff shows them as intentional.

| File | Upstream | Here | Why |
| --- | --- | --- | --- |
| `sidebar.tsx` | `ml-0` / `ml-2` on `SidebarInset` | `ms-0` / `ms-2` | The inset gutter must close against the rail. In Arabic the rail is on the right, so a left margin opens the gap on the wrong side. |
| `toggle-group.tsx` | `rounded-l-lg` / `rounded-r-lg` / `border-l` on the horizontal variant | `rounded-s-lg` / `rounded-e-lg` / `border-s` | The first item's corners must round on the side the group starts at, which flips with the reading direction. |

Nothing else in this directory differs from upstream.

## Licence

MIT. Copyright (c) 2024 Mohammed Arham Khan. The full licence text is in
`LICENSE-shadcn-admin` at the repository root.
