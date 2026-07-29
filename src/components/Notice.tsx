import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export interface NoticeProps extends HTMLAttributes<HTMLParagraphElement> {
  /** `red` for errors, `amber` for warnings, `green` for success,
   * `brass` for branded progress lines, `dim` for quiet notes. */
  tone?: "red" | "amber" | "green" | "brass" | "dim";
  /** Pulsing mono-uppercase treatment for in-progress status lines. */
  pulse?: boolean;
}

/**
 * Inline status line. Defaults `role` to "alert" for red notices and
 * "status" for pulsing ones so screen readers announce them.
 */
export function Notice({ tone = "dim", pulse = false, role, className, children, ...rest }: NoticeProps) {
  return (
    <p
      role={role ?? (tone === "red" ? "alert" : pulse ? "status" : undefined)}
      className={cx("qo-notice", `qo-notice--${tone}`, pulse && "qo-notice--pulse", className)}
      {...rest}
    >
      {children}
    </p>
  );
}
