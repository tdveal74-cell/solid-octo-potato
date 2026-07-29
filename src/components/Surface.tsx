import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Add interior padding around the content (default true). */
  padded?: boolean;
}

/**
 * Root canvas of The Quiet Operator: the ink background with fog text and
 * the body type stack. Wrap every screen in a Surface — components are
 * designed for this dark canvas and are illegible on white.
 */
export function Surface({ padded = true, className, children, ...rest }: SurfaceProps) {
  return (
    <div
      className={cx("qo-surface", padded && "qo-surface--padded", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
