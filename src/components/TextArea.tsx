import type { TextareaHTMLAttributes } from "react";
import { cx } from "./cx";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Multi-line text input on the raised surface — the Council's question box.
 * Accepts all native textarea props (rows, value, placeholder, …).
 */
export function TextArea({ className, ...rest }: TextAreaProps) {
  return <textarea className={cx("qo-input", className)} {...rest} />;
}
