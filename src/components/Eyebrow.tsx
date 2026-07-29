import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  /** Text color: `brass` (default) for emphasis, `dim` for quiet section
   * labels, signal tones for stances and states. */
  tone?: "brass" | "dim" | "fog" | "green" | "amber" | "red";
  /** `xs` (default) is the 10px microtype; `sm` is 12px. */
  size?: "xs" | "sm";
  /** Set false for the sans-serif section-label style. */
  mono?: boolean;
  /** Extra-wide letterspacing for hero kickers. */
  wide?: boolean;
  /** Rendered element (default `p`). */
  as?: "p" | "h2" | "h3" | "span";
}

/**
 * Uppercase microtype label — the system's signature small text. Used for
 * kickers above headings, section labels, stance tags, and metadata lines.
 */
export function Eyebrow({
  tone = "brass",
  size = "xs",
  mono = true,
  wide = false,
  as: Tag = "p",
  className,
  children,
  ...rest
}: EyebrowProps) {
  return (
    <Tag
      className={cx(
        "qo-eyebrow",
        `qo-eyebrow--${tone}`,
        size === "sm" && "qo-eyebrow--sm",
        !mono && "qo-eyebrow--sans",
        wide && "qo-eyebrow--wide",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
