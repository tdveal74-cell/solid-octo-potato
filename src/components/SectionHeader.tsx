import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import { Eyebrow } from "./Eyebrow";

export interface SectionHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** The heading text, set in the display serif. */
  title: ReactNode;
  /** Optional brass mono kicker above the title. */
  eyebrow?: ReactNode;
  /** Optional dim description paragraph under the title. */
  description?: ReactNode;
  /** Heading level: 1 = page title (h1), 2 = section title (h2). */
  level?: 1 | 2;
  /** `lg` bumps a level-1 title to hero size. */
  size?: "md" | "lg";
}

/**
 * Page or section opener: serif display title with optional kicker and
 * description. Every screen starts with one.
 */
export function SectionHeader({
  title,
  eyebrow,
  description,
  level = 1,
  size = "md",
  className,
  children,
  ...rest
}: SectionHeaderProps) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div
      className={cx("qo-section-header", size === "lg" && "qo-section-header--lg", className)}
      {...rest}
    >
      {eyebrow !== undefined && <Eyebrow wide={size === "lg"} size={size === "lg" ? "sm" : "xs"}>{eyebrow}</Eyebrow>}
      <Heading
        className={cx(
          "qo-heading",
          `qo-heading--${level}`,
          size === "lg" && "qo-heading--lg"
        )}
      >
        {title}
      </Heading>
      {description !== undefined && (
        <p className="qo-section-header__desc">{description}</p>
      )}
      {children}
    </div>
  );
}
