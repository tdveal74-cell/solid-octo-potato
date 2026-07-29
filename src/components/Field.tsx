import type { LabelHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface FieldProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** The visible field label. */
  label: ReactNode;
  /** Optional 10px dim hint under the control. */
  hint?: ReactNode;
  /** The form control(s) the label describes. */
  children: ReactNode;
}

/**
 * Labeled form row: stacks a label, a control, and an optional hint.
 * Pass `htmlFor` matching the control's id.
 */
export function Field({ label, hint, className, children, ...rest }: FieldProps) {
  return (
    <div className={cx("qo-field", className)}>
      <label className="qo-field__label" {...rest}>
        {label}
      </label>
      {children}
      {hint !== undefined && <p className="qo-field__hint">{hint}</p>}
    </div>
  );
}
