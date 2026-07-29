# The Quiet Operator — build conventions (Ultra Quantum Flagship)

Cinematic ops-console system: near-black ink surfaces, warm gold accents with
subtle glow, Space Grotesk type, wide-tracked mono microtype, hairline
white-alpha rules, 10px radii. Restrained — glow marks live state and primary
action, never decoration; no gradients.

## Wrap every screen in `Surface`

Components are designed for the ink canvas and are **illegible on white**
(fog text ≈ #f2f0ea). Always start with:

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

`Surface` paints `--color-ink`, sets fog text and the body type stack.
`padded` defaults true; pass `padded={false}` when composing your own page
padding (the app uses a 72rem centered column: `maxWidth: "72rem",
margin: "0 auto", padding: "0 1.5rem"`).

## Styling idiom: components + tokens, no utility classes

There is **no utility-class system**. Use the components for every control and
panel; for your own layout glue (grids, stacks, spacing) use inline styles —
flex/grid with rem gaps — and reference the design tokens as CSS variables:

| Token | Value / use |
|---|---|
| `--color-ink` / `--color-ink-raised` / `--color-ink-border` | page bg / panel bg / hairline rules (white-alpha) |
| `--color-fog` / `--color-fog-dim` | primary / secondary text |
| `--color-brass` / `--color-brass-bright` / `--color-brass-dim` | gold accent, CTAs / hover+glow / muted gold borders |
| `--color-signal-green` / `--color-signal-amber` / `--color-signal-red` | ok / warning / error (red is warm pink) |
| `--color-signal-purple` / `--color-signal-cyan` | agent + metric accent colors |
| `--font-display` | Space Grotesk — headings at weight 600, tight tracking |
| `--font-body` | Space Grotesk — everything else, weights 300–500 |
| `--font-mono` | IBM Plex Mono — microtype labels, ids, code |

Signature moves: uppercase 10px mono labels with 0.16em tracking (`Eyebrow`)
above things; weight-600 display headings; hairline
`1px solid var(--color-ink-border)` rules to divide sections; glow only on
live-state dots and primary hover (`box-shadow: 0 0 8px currentColor`);
signal colors only for state, gold for emphasis.

## Where the truth lives

Read `styles.css` → `_ds_bundle.css` for tokens and the full `qo-*` component
CSS. Each component's API is `components/general/<Name>/<Name>.d.ts`; usage
examples are in `<Name>.prompt.md`.

## Components (all from `window.QuietOperator` / `quiet-operator`)

Surface, SectionHeader, Eyebrow, Button, Card, Stat, StatusPill, Notice,
ArrowList, DataTable, Field, TextInput, TextArea, Checkbox, RangeField.

Compose forms as `Field` + `TextInput`/`TextArea`; status chips are
`StatusPill` (lowercase text; add `dot` for live states); key figures are a
grid of `Stat`; lists of conditions/dissent are `ArrowList` (`marker="arrow"`
or `"dash"`).
