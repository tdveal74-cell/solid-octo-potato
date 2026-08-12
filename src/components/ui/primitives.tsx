import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The Quiet Operator's shared UI vocabulary.
 *
 * Every page was restating the same markup — the display-font heading, the
 * `border-ink-border` card, the brass eyebrow, the mono micro-label. Restated
 * markup drifts: one page rounds a corner differently, another picks a
 * different dim, and the product stops looking like one product. These are the
 * single place each of those is defined.
 *
 * The brand rule the components encode: **brass is the accent, and it is
 * scarce.** It marks the one thing that matters in a view — a primary action, a
 * live signal, a council weight. A surface that uses brass for everything has
 * used it for nothing.
 */

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Small brass label above a heading. Sets the register before the words land. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx(
        "font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-brass",
        className
      )}
    >
      {children}
    </p>
  );
}

/** Display-face heading. `level` sets the tag; `size` sets the scale. */
export function Heading({
  children,
  level = 2,
  size = "md",
  className,
}: {
  children: ReactNode;
  level?: 1 | 2 | 3;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}) {
  const Tag = (["h1", "h2", "h3"] as const)[level - 1];
  return (
    <Tag
      className={cx(
        "font-[family-name:var(--font-display)] text-fog",
        size === "sm" && "text-xl",
        size === "md" && "text-3xl",
        size === "lg" && "text-4xl",
        size === "hero" && "text-5xl leading-tight",
        className
      )}
    >
      {children}
    </Tag>
  );
}

/** Body copy at reading width. */
export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("max-w-2xl leading-relaxed text-fog-dim", className)}>{children}</p>;
}

/**
 * A ruled band of content. The top rule is what separates one idea from the
 * next on a long page, so it belongs to the section rather than being drawn by
 * hand each time.
 */
export function Section({
  title,
  lede,
  eyebrow,
  aside,
  first,
  children,
  className,
}: {
  title?: string;
  lede?: string;
  eyebrow?: string;
  aside?: ReactNode;
  /** Drop the top rule and reduce padding — for the first band on a page. */
  first?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx(first ? "py-16" : "border-t border-ink-border py-20", className)}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      {(title || aside) && (
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          {title && <Heading>{title}</Heading>}
          {aside}
        </div>
      )}
      {lede && <Lede className="mt-3">{lede}</Lede>}
      {children && <div className={title || lede || eyebrow ? "mt-10" : undefined}>{children}</div>}
    </section>
  );
}

/**
 * Bordered panel. `raised` lifts it off the page ground; use it when a card
 * needs to read as a distinct object rather than a ruled region.
 */
export function Card({
  children,
  raised,
  interactive,
  className,
}: {
  children: ReactNode;
  raised?: boolean;
  /** Adds a hover response — only for cards that are actually clickable. */
  interactive?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-sm border border-ink-border p-5",
        raised && "bg-ink-raised",
        interactive && "transition-colors duration-200 hover:border-brass-dim",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Card title, sized to sit inside a grid without competing with the section. */
export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cx("text-sm font-semibold text-fog", className)}>{children}</h3>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("mt-2 text-xs leading-relaxed text-fog-dim", className)}>{children}</p>;
}

/** Mono micro-label for machine facts: weights, counts, ids, versions. */
export function Meta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx(
        "font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-brass",
        className
      )}
    >
      {children}
    </p>
  );
}

type Tone = "neutral" | "accent" | "good" | "warn" | "bad";

const badgeTone: Record<Tone, string> = {
  neutral: "border-ink-border text-fog-dim",
  accent: "border-brass-dim text-brass",
  good: "border-signal-green/40 text-signal-green",
  warn: "border-signal-amber/40 text-signal-amber",
  bad: "border-signal-red/40 text-signal-red",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center rounded-sm border px-1.5 py-0.5",
        "font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest",
        badgeTone[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const buttonBase =
  "inline-flex items-center justify-center rounded-sm px-6 py-3 text-sm transition-colors duration-200 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass " +
  "disabled:pointer-events-none disabled:opacity-50";

const buttonVariant = {
  // Brass is the accent and it is scarce: one primary action per view.
  primary: "bg-brass font-medium text-ink hover:bg-brass-dim",
  secondary: "border border-ink-border text-fog hover:border-brass",
  ghost: "text-fog-dim hover:text-fog",
} as const;

type Variant = keyof typeof buttonVariant;

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cx(buttonBase, buttonVariant[variant], className)} {...props} />;
}

/** Same surface as Button, for navigation rather than action. */
export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant }) {
  return (
    <Link href={href} className={cx(buttonBase, buttonVariant[variant], className)} {...props}>
      {children}
    </Link>
  );
}

/** Responsive card grid. Columns are the only thing worth varying per use. */
export function Grid({
  cols = 3,
  children,
  className,
}: {
  cols?: 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-1 gap-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Page shell. One max-width and gutter for every route. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto max-w-6xl px-6", className)}>{children}</div>;
}

/** A labelled figure — the readout shape used across dashboard and audit. */
export function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
}) {
  const valueTone =
    tone === "good"
      ? "text-signal-green"
      : tone === "warn"
        ? "text-signal-amber"
        : tone === "bad"
          ? "text-signal-red"
          : "text-fog";
  return (
    <Card raised>
      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-fog-dim">
        {label}
      </p>
      <p className={cx("mt-2 font-[family-name:var(--font-display)] text-2xl tabular-nums", valueTone)}>
        {value}
      </p>
    </Card>
  );
}

/**
 * Form field surface. Every input in the product sits on the same ground with
 * the same focus treatment, so a form never looks assembled from parts.
 */
const fieldBase =
  "w-full rounded-sm border border-ink-border bg-ink-raised text-sm text-fog " +
  "placeholder:text-fog-dim focus:border-brass focus:outline-none";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldBase, "p-3", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldBase, "p-4 leading-relaxed", className)} {...props} />;
}

/** Field label. Pair with an input's id so the hit area is the label too. */
export function Label({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cx("block text-sm text-fog", className)}>
      {children}
    </label>
  );
}

/** Empty state — says what is absent and what would fill it. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-ink-border px-6 py-12 text-center text-sm text-fog-dim">
      {children}
    </div>
  );
}
