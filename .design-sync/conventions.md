# The Quiet Operator — build conventions

Dark editorial system: ink surfaces, fog text, brass accents, serif display
headings, mono microtype. Quiet, ruled, low-chrome — no gradients, no shadows,
no rounded-corner softness beyond the 4px radius the components already carry.

## Wrap every screen in `Surface`

Components are designed for the ink canvas and are **illegible on white**
(fog text ≈ #e8e6e1). Always start with:

```jsx
import { Surface, SectionHeader, Button } from "quiet-operator";

<Surface>
  <SectionHeader
    title="Convene the Council"
    description="Put a decision before all eight councils."
  />
  <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
    <Button>Deliberate</Button>
    <Button variant="outline">See the Council</Button>
  </div>
</Surface>
```

`Surface` paints `--color-ink`, sets fog text and the body font stack.
`padded` defaults true; pass `padded={false}` when composing your own page
padding (the app uses a 72rem centered column: `maxWidth: "72rem",
margin: "0 auto", padding: "0 1.5rem"`).

## Styling idiom: components + tokens, no utility classes

There is **no utility-class system**. Use the components for every control and
panel; for your own layout glue (grids, stacks, spacing) use inline styles —
flex/grid with rem gaps — and reference the design tokens as CSS variables:

| Token | Value / use |
|---|---|
| `--color-ink` / `--color-ink-raised` / `--color-ink-border` | page bg / card bg / 1px rules |
| `--color-fog` / `--color-fog-dim` | primary / secondary text |
| `--color-brass` / `--color-brass-dim` | accent, CTAs / hover, accent borders |
| `--color-signal-green` / `--color-signal-amber` / `--color-signal-red` | ok / warning / error |
| `--font-display` | Georgia serif — headings only, weight 400 |
| `--font-body` | Helvetica Neue — everything else |
| `--font-mono` | SF Mono — microtype labels, ids, code |

Signature moves: uppercase 10px mono labels (`Eyebrow`) above things; serif
display headings at weight 400 (`SectionHeader`); 1px `--color-ink-border`
rules to divide sections (`borderTop: "1px solid var(--color-ink-border)"`);
signal colors only for state, brass for emphasis.

## Where the truth lives

Read `styles.css` → `_ds_bundle.css` for tokens and the full `qo-*` component
CSS. Each component's API is `components/general/<Name>/<Name>.d.ts`; usage
examples are in `<Name>.prompt.md`.

## Components (all from `window.QuietOperator` / `quiet-operator`)

Surface, SectionHeader, Eyebrow, Button, Card, Stat, StatusPill, Notice,
ArrowList, DataTable, Field, TextInput, TextArea, Checkbox, RangeField.

Compose forms as `Field` + `TextInput`/`TextArea`; status chips are
`StatusPill` (lowercase text reads best); key figures are a grid of `Stat`;
lists of conditions/dissent are `ArrowList` (`marker="arrow"` or `"dash"`).
