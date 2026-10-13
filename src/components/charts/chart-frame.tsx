import type { ReactNode } from "react";

/**
 * Wraps a chart with the thing every chart in this admin must have: a text
 * equivalent.
 *
 * A chart is a picture of numbers. Someone using a screen reader, or reading on
 * a phone where the plot is 200px wide, needs the numbers themselves — so every
 * chart renders its series as a real table, visually hidden, and marks the
 * drawing `aria-hidden`. This is why the charts are hand-drawn SVG rather than a
 * library: the table is not an export feature to switch on later, it is the
 * accessible content, and it has to be part of the component.
 */
export function ChartFrame({
  caption,
  columnHeaders,
  rows,
  children,
}: {
  caption: string;
  columnHeaders: readonly [string, string];
  rows: readonly (readonly [string, string])[];
  children: ReactNode;
}) {
  return (
    <figure className="m-0">
      <div aria-hidden="true">{children}</div>
      <figcaption className="sr-only">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{columnHeaders[0]}</th>
              <th scope="col">{columnHeaders[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
