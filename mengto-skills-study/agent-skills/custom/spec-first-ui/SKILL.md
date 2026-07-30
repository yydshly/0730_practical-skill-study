---
name: spec-first-ui
description: Use when asked to generate, revise, or evaluate UI — a landing page, dashboard, component, or mobile screen. Start with a written spec before any generation. Use to prevent inconsistent outputs, endless iterations, or misaligned designs.
---

# Spec-First UI

Prompt like a design system, not a wish.

## When to use

- The user asks to "design a landing page", "make a dashboard UI", "create a component", "redesign this screen"
- AI-generated UI varies wildly between attempts
- You keep iterating without a clear completion point
- The user's request is vague ("make it look modern")

## 1. Write the spec before touching generation

Fill this template before generating anything:

```
GOAL
- What: (landing page hero / dashboard / mobile screen / component)
- For whom: (persona and context)
- Success: (clarity / conversion / aesthetic quality)

FORMAT
- Size / aspect ratio:
- Safe margins:
- Responsive breakpoints:

LAYOUT (wireframe in words)
- Grid:
- Placement:
- Hierarchy: H1 → subhead → body → CTA

TYPE SYSTEM
- Font family:
- Scale: (H1 px / body px / label px)
- Weights: H1 bold, body regular
- Leading:

COLOR
- Background:
- Text primary:
- Text secondary:
- Accent (one only):
- Border / divider:

UI STYLE
- Style: (minimal / editorial / glass / playful 3D)
- Shadows: (none / subtle / dramatic)
- Border radius: (sharp / soft / pill)

COPY (exact — do not paraphrase)
- Line 1:
- Line 2:
- CTA:

CONSTRAINTS (change 1–2 things only per variant)
- FONT: ___
- STYLE: ___
- ACCENT: ___
- MODE: ___

NEGATIVE PROMPT
- No logos, watermarks, extra text
- No gibberish typography
- No low-quality stock imagery
```

## 2. Generate from the spec

Invoke the image generation tool with the filled spec. Do not deviate from specified values. If the model ignores a constraint, re-prompt with that constraint emphasized.

## 3. Evaluate against the spec

```
Spec item         → Generated output     → Pass/Fail
─────────────────────────────────────────────────────
Layout matches     → Rows/columns align  → PASS
H1 is bold/heavy   → Visual weight at top → PASS
One accent color   → No rainbow palette  → PASS
No extra text      → Only specified copy → PASS
```

## 4. Iterate with single-variable changes

When revising, change only one constraint at a time:
- Variant A: same spec, change accent color
- Variant B: same spec, change font family
- Variant C: same spec, change layout grid

Do not change multiple variables simultaneously — you will not know which change caused which effect.

## 5. Two-pass for text accuracy

If the model consistently misspells or omits specified copy:
1. Pass 1: Generate without text (reserve a text-safe area)
2. Pass 2: Typeset the copy separately (Figma, CSS, or a second generation with strict copy constraints)

## Quality bar

- Spec was written before any generation occurred
- Every spec field was filled (no "TBD" or skipped sections)
- Generated output matches at least 8 of 10 spec items
- Constraints were changed one at a time between variants
- Copy in the output matches the spec verbatim

## Pitfalls

- **Prompt-only**: generating without a written spec, then adjusting to match
- **Multi-variable revision**: changing font, color, and layout simultaneously
- **Vague goals**: "make it pop" or "make it look professional" — these are not specs
- **Self-verification**: the generator marks their own output as matching the spec without checking
- **Over-constrained**: packing 15 constraints into one generation — narrow to the 5 that matter most
