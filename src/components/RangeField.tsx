import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface RangeFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Short factor name, e.g. "Routine". */
  label: ReactNode;
  /** Current value echoed beside the label, e.g. `5`. */
  valueLabel?: ReactNode;
  /** 10px hint under the slider, e.g. "rule-based / repeatable". */
  hint?: ReactNode;
}

/**
 * Compact labeled range slider — the audit's factor control. Shows
 * "Label: value" above a brass-accented slider with an optional hint.
 */
export function RangeField({
  label,
  valueLabel,
  hint,
  className,
  ...rest
}: RangeFieldProps) {
  return (
    <label className={cx("qo-range-field", className)}>
      <span className="qo-range-field__value">
        {label}
        {valueLabel !== undefined && <>: {valueLabel}</>}
      </span>
      <input type="range" {...rest} />
      {hint !== undefined && <span className="qo-range-field__hint">{hint}</span>}
    </label>
  );
}
