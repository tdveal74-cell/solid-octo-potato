import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface DataTableProps extends HTMLAttributes<HTMLDivElement> {
  /** Column headers, rendered small and dim. */
  columns: ReactNode[];
  /** Row cells, one array per row, in column order. */
  rows: ReactNode[][];
}

/**
 * Minimal ruled data table (horizontal rules only, no cell borders),
 * horizontally scrollable on narrow screens.
 */
export function DataTable({ columns, rows, className, ...rest }: DataTableProps) {
  return (
    <div className={cx("qo-table-wrap", className)} {...rest}>
      <table className="qo-table">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
