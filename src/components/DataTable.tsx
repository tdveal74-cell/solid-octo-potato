import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface DataTableProps extends HTMLAttributes<HTMLDivElement> {
  /** Column headers, rendered small and dim. */
  columns: ReactNode[];
  /** Row cells, one array per row, in column order. */
  rows: ReactNode[][];
  /** Per-column alignment, in column order (default left). Right-align
   * numeric columns. */
  align?: Array<"left" | "right" | "center">;
  /** Shown instead of the body when `rows` is empty. */
  empty?: ReactNode;
}

/**
 * Minimal ruled data table (horizontal rules only, no cell borders) with
 * tabular numerals, horizontally scrollable on narrow screens.
 */
export function DataTable({ columns, rows, align, empty, className, ...rest }: DataTableProps) {
  const alignClass = (i: number) => {
    const a = align?.[i];
    return a && a !== "left" ? `qo-table--${a}` : undefined;
  };
  return (
    <div className={cx("qo-table-wrap", className)} {...rest}>
      <table className="qo-table">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} className={alignClass(i)}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty !== undefined ? (
            <tr>
              <td className="qo-table__empty" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={alignClass(j)}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
