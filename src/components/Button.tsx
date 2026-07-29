import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

interface ButtonBaseProps {
  /** Visual style. `primary` is the brass call-to-action; `outline` is the
   * quiet secondary; `ghost` is an inline text action; `ghost-danger` is an
   * inline destructive action (e.g. "remove"). */
  variant?: "primary" | "outline" | "ghost" | "ghost-danger";
  /** `md` (default) for standalone CTAs, `sm` for form rows and toolbars. */
  size?: "md" | "sm";
  /** Render as an anchor navigating here instead of a button. */
  href?: string;
}

export type ButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "type"> & {
    /** Button type when rendered as a button (default "button"). */
    type?: "button" | "submit" | "reset";
  };

/**
 * Action trigger in The Quiet Operator's brass-on-ink language. Renders a
 * `<button>` by default, or an `<a>` when `href` is given.
 */
export function Button({
  variant = "primary",
  size = "md",
  href,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = cx(
    "qo-btn",
    `qo-btn--${variant}`,
    size === "sm" && "qo-btn--sm",
    className
  );
  if (href !== undefined) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
