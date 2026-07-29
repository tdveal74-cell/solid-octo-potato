import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface ArrowListProps extends HTMLAttributes<HTMLUListElement> {
  /** One entry per line; each is prefixed with the marker. */
  items: ReactNode[];
  /** `arrow` (▸) for actionable items, `dash` (—) for dissent/quotes. */
  marker?: "arrow" | "dash";
  /** Text color of the whole list. */
  tone?: "fog" | "dim" | "amber" | "green";
}

/**
 * Marker-prefixed list for conditions, dissent, and task callouts —
 * the system's alternative to bullet points.
 */
export function ArrowList({
  items,
  marker = "arrow",
  tone = "fog",
  className,
  ...rest
}: ArrowListProps) {
  return (
    <ul
      className={cx("qo-list", `qo-list--${marker}`, `qo-list--${tone}`, className)}
      {...rest}
    >
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
