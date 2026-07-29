import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  /** Uppercase microtype label above the value, e.g. "Councils seated". */
  label: ReactNode;
  /** The headline figure, rendered in brass display serif. */
  value: ReactNode;
  /** Optional support line under the value, e.g. "strong agreement (0.86)". */
  sub?: ReactNode;
  /** Render the value in the mono stack (for model ids, hashes, code). */
  mono?: boolean;
  /** Center-align label, value, and sub — the metric-card layout. */
  center?: boolean;
}

/**
 * Key-figure card: a labeled number on the raised surface. Use a grid of
 * Stats for system status and deliberation metrics.
 */
export function Stat({
  label,
  value,
  sub,
  mono = false,
  center = false,
  className,
  ...rest
}: StatProps) {
  return (
    <div
      className={cx(
        "qo-card qo-card--raised qo-card--pad-sm qo-stat",
        center && "qo-stat--center",
        className
      )}
      {...rest}
    >
      <p className="qo-eyebrow qo-eyebrow--dim">{label}</p>
      <p className={cx("qo-stat__value", mono && "qo-stat__value--mono")}>{value}</p>
      {sub !== undefined && <p className="qo-stat__sub">{sub}</p>}
    </div>
  );
}
