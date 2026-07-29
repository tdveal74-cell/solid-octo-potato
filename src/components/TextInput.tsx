import type { InputHTMLAttributes } from "react";
import { cx } from "./cx";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** `md` (default) for standalone fields, `sm` for dense inline rows. */
  inputSize?: "md" | "sm";
}

/**
 * Single-line text input on the raised surface; border warms to brass on
 * focus. Accepts all native input props (type, value, placeholder, …).
 */
export function TextInput({ inputSize = "md", className, ...rest }: TextInputProps) {
  return (
    <input
      className={cx("qo-input", inputSize === "sm" && "qo-input--sm", className)}
      {...rest}
    />
  );
}
