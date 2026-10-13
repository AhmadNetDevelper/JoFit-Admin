/**
 * WCAG relative-luminance contrast, for the theme editor.
 *
 * Only hex colours are understood. The storefront would accept any CSS colour,
 * but a ratio can only be computed for a colour the admin can parse — and a
 * contrast check that silently passes `rgb()` is worse than one that asks for
 * hex.
 */
export function parseHexColor(value: string): readonly [number, number, number] | undefined {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return undefined;
  const hex = match[1]!.length === 3 ? [...match[1]!].map((digit) => digit + digit).join("") : match[1]!;
  return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)) as unknown as readonly [
    number,
    number,
    number,
  ];
}

function luminance([red, green, blue]: readonly [number, number, number]): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

/** `undefined` when either colour is not a hex colour. */
export function contrastRatio(foreground: string, background: string): number | undefined {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!fg || !bg) return undefined;
  const [lighter, darker] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}
