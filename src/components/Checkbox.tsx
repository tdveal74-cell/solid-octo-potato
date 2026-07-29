import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Inline label text rendered beside the box. */
  label: ReactNode;
}

/**
 * Brass-accented checkbox with an inline dim label, e.g.
 * "Include debate round (phase 2)".
 */
export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx("qo-checkbox", className)}>
      <input type="checkbox" {...rest} />
      {label}
    </label>
  );
}
