import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  /** Signal color: `green` = healthy/online, `amber` = attention required,
   * `red` = failing, `brass` = branded highlight, `neutral` = inert. */
  tone?: "green" | "amber" | "red" | "brass" | "neutral";
  /** `md` (default) for page headers; `sm` for inline badges on cards. */
  size?: "md" | "sm";
}

/**
 * Bordered mono-uppercase status chip, e.g. "intelligence online" or
 * "api key required". One short phrase, lowercase input reads best.
 */
export function StatusPill({
  tone = "neutral",
  size = "md",
  className,
  children,
  ...rest
}: StatusPillProps) {
  return (
    <span
      className={cx("qo-pill", `qo-pill--${tone}`, size === "sm" && "qo-pill--sm", className)}
      {...rest}
    >
      {children}
    </span>
  );
}
