import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `outline` (default) is a bare bordered panel; `raised` adds the
   * ink-raised surface; `accent` marks a headline result with a brass-dim
   * border on the raised surface. */
  variant?: "outline" | "raised" | "accent";
  /** Brass border on hover — use when the card sits inside a link. */
  interactive?: boolean;
  /** Interior padding: `xs` for dense roster rows, `sm` (default) for
   * standard cards, `md` for feature panels. */
  padding?: "xs" | "sm" | "md";
}

/**
 * Bordered panel — the basic surface of The Quiet Operator. Compose freely:
 * stats, rosters, verdicts, and forms all sit on Cards.
 */
export function Card({
  variant = "outline",
  interactive = false,
  padding = "sm",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        "qo-card",
        variant !== "outline" && `qo-card--${variant}`,
        interactive && "qo-card--interactive",
        `qo-card--pad-${padding}`,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
