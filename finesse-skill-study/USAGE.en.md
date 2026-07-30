[中文](USAGE.md) | [English](USAGE.en.md)

# Usage Checklist — Get Good Results With Zero Design Experience

This isn't the rules file the Skill reads (`skills/finesse-ui/SKILL.md` — thousands of lines of internal decision logic you don't need to read). This one is for **you**: how to phrase the ask, what it replies with, how to confirm direction, how to iterate, how to keep a multi-page project consistent, and how to do a final check. Read it once, then use it as a reference.

---

## The 30-second version

1. State the **page type** (landing/dashboard/portfolio/commerce) + **1-2 mood words**.
2. It replies with a one-line judgment (Design Read) — **it only starts writing code once you confirm.**
3. Don't say "redo it" — **point at the specific thing you don't like** (one sentence, e.g. "too plain"); it fixes only that.
4. Building a whole page set? Say "keep these consistent" up front — it locks a spec that every later page follows.
5. Before shipping, run `audit` — a read-only diagnostic that reports findings without touching code; you decide what to fix.

Each point is expanded below.

---

## 1. Your first message: how to describe what you need

### 1.1 State the page type first — this is the single most important sentence

finesse splits pages into three genuinely different routes. Naming the type tells it which logic to apply:

| Type | What it is | Examples | Layout thinking |
|---|---|---|---|
| **brand (landing/marketing)** | Design IS the product — landing pages, brand sites, launches, portfolios, industry hero pages | "A landing page for a yoga studio", "a photographer's personal portfolio", "a product launch page" | Goes for spectacle and first impression, one point per screen, reaches for a real visual engine (3D particles / Canvas motion / GSAP scroll storytelling) |
| **product (dashboard/app)** | Design SERVES the product — dashboards, admin panels, data analytics, settings pages | "A data dashboard for our ops team", "an order-management page for an e-commerce backend", "a SaaS admin panel" | Goes for clarity and information density, no showing off — charts/tables/forms need to survive daily use |
| **commerce (selling pages)** | Pages that sell something — product detail pages, listing pages, cart, checkout | "A flagship product's detail page", "a filterable product listing page", "the checkout flow" | Selling one item leans brand (needs a vibe); listing/filter pages lean product (density, efficiency first) |

**Not sure which bucket?** Just say so — "I'm not sure if this should feel more showcase-y or more tool-y" — and it will ask a clarifying question rather than guess blindly.

### 1.2 Mood words: give 1-2 of the most important ones, not a pile

Internally, finesse converts your adjectives into three "dials" — **SOUL** (how distinct the personality is), **SPECTACLE** (how technically ambitious the visuals are), **DENSITY** (information per screen). Precise words convert cleanly; a pile of adjectives fights itself. Roughly, here's how common words get read (no need to memorize — just know this mapping exists):

| You say | Roughly translates to |
|---|---|
| "premium", "luxury", "high-end" | Distinct style, moderate motion, not too dense — a boutique feel |
| "minimal", "clean", "understated" | Quieter style, little motion, generous whitespace |
| "bold", "striking", "impactful" | Both style and motion pushed to the max |
| "editorial", "magazine-like" | Careful typography, motion present but not dominant, moderate-to-high content |
| "tech", "AI-ish", "SaaS-y" | Moderate style, stronger motion, medium information density |
| "corporate", "B2B", "enterprise" | Restrained style, almost no showing off, higher information density |
| "playful", "creative", "fun" | Distinct style, moderate-to-strong motion, moderate content |
| "data-heavy", "dashboard-like", "admin-analytics" | Almost no showing off, information density maxed |

- ✅ Good phrasing: "quiet and premium", "bold and striking", "restrained editorial", "warm vintage"
- ❌ Bad phrasing: "minimal but also techy but also warm but also high-end but not too flashy" (too many words and finesse doesn't know which one to prioritize — you get a page that's a bit of everything and a lot of nothing)

If you have a reference in mind ("something like the vibe of [brand]"), naming it or describing the specific image you remember works far better than stacking adjectives.

---

## 2. It replies with a judgment first — the Design Read

Before finesse writes any code, it **always** outputs a one-line judgment, roughly:

```
Design Read: deep-space astronomy · cinematic + reverent · register=brand · SPECTACLE=8 · hero-engine=Three.js particle galaxy
```

Breaking it down: **industry positioning · style direction · which route (brand/product/commerce) · how ambitious the visuals are on a 1-10 scale · what technique drives the visual centerpiece**.

**This step stops and waits for you to confirm.** You have three ways to respond:

1. **"Go ahead" / "looks good"** — only then does it actually start writing code.
2. **Point out what's wrong** — e.g. "too techy, we want it warmer", "that's not the right tone for this industry." It re-judges and gives you a new Design Read instead of plowing through a full page with the wrong direction, which you'd only discover afterward.
3. **Add missing context** — if the direction is mostly right but missing something (e.g. "this is mainly for older users"), just add it — it folds that into the judgment.

**Why this step matters**: skipping confirmation and saying "whatever, you decide" means that if the direction turns out wrong, redoing it costs far more than the 10 seconds it takes to confirm now.

---

## 3. After the first draft: how to give feedback and iterate

### 3.1 The core principle — point at it, don't ask for a rebuild

finesse has a set of targeted iteration commands. What you say gets mapped to one of them, **changing only that piece, never rebuilding from scratch**:

| You can say | Maps to | What happens |
|---|---|---|
| "too plain" / "want more impact" / "boring" | `bolder` | Raises SPECTACLE (+2), upgrades the visual engine if needed (e.g. Canvas → Three.js) |
| "too flashy" / "overwhelming" / "exhausting" | `quieter` | Lowers SPECTACLE (−2), swaps to lighter motion or CSS-only |
| "feels off" / "too generic" / "not our vibe" | `soul` | Re-picks the style direction from scratch |
| "too sparse" / "not enough content" | `densify` | Raises information density, adds content |
| "too cluttered" / "too busy" | `densify` (reverse) | Lowers density, trims content, opens up spacing |
| "add a 3D moment" / "want a premium hover" | `depth` | Adds one 3D interaction moment (tilt/flip/depth-parallax cards) without restructuring |
| "want different motion" / "don't like this animation" | `animate` | Swaps the visual engine type, leaves everything else |
| "this one thing looks bad" (a button, a color, a component, some copy) | — | Fixes only what you named, everything else stays |
| "is this page any good? review it" | `audit` | Diagnoses and lists findings, **changes no code** |
| "this page needs an upgrade" | `redesign` | Diagnoses first, then fixes — not a blind full rebuild |

### 3.2 A small trick for clearer feedback

The more specific the feedback, the more accurate the fix:

- ❌ "doesn't feel quite right" — finesse doesn't know where to start
- ✅ "the hero headline is too small, want more presence" — names the area + the problem
- ✅ "overall fine, but the button color clashes with the page" — names the component
- ✅ "this section is cramped on mobile" — names the scenario

### 3.3 Raise one class of issue at a time

If you want both "more impact" and "denser content," you can say both at once — but if you've been sitting on 5 new thoughts after seeing a version, confirm the current direction is right first, then raise them one at a time. Otherwise things get crossed.

---

## 4. Building a whole page set: how to look like "it's from one company"

### 4.1 When you need to "lock" it

If you just need one one-off page, skip this section — steps 1-3 are enough.

But if you're building **a site + a dashboard + a landing page** as a set, or it's a **long-running project** (site this week, product page next week, more pages added next month), say this up front:

> "These pages need to share a consistent look" / "Set up a project spec first, and have later pages follow it"

### 4.2 What happens after you say that

finesse writes a `PRODUCT.md` (the project's long-term memory — industry, users, style direction, locked dial values, what it must never look like) and/or a `design-model.yaml` (the concrete color/type/radius/spacing spec). **You don't need to write or maintain these yourself** — finesse generates and updates them automatically. All you need to know:

- After the first page is built, its colors, fonts, and component look get recorded.
- Before every later page, finesse reads this memory first and follows it — it won't improvise a new palette or font on its own.
- If a later page genuinely needs a different feel (e.g. the dashboard should be more restrained than the marketing site), just say why — finesse records that as a deliberate exception instead of quietly breaking overall consistency.

### 4.3 What if there's already a codebase

If you're not starting from zero and pages already exist, say "check what design system is already in use here" — finesse reads the existing code and reverse-engineers a `design-model.yaml` from it, so new pages follow the established look instead of starting a different one.

---

## 5. Before you ship: the final check

Say "check this page for me" or just `audit` — finesse runs a **read-only diagnostic** (changes no code) and scores it against several hard rule categories:

- **Directional consistency** — has the palette drifted, is there a stray second accent color that showed up somewhere
- **Obvious AI tells** — stray em-dashes, gradient text, a wall of identical icon-cards, invented precise-sounding numbers ("92%", "4.1×") with no real data behind them
- **Accessibility/usability** — is text contrast sufficient, are buttons reachable on mobile, is it keyboard-navigable, does motion respect the system's "reduce motion" setting
- **Performance** — will images/animation slow the page down, is there an unwanted horizontal scrollbar on mobile

The result is a prioritized findings list — **it does not touch code on its own**. You review it and say "fix X first" — you always keep the call on what to fix and when.

---

## 6. Three full examples

### Example 1: a brand landing page

```
You: A landing page for a specialty coffee roastery — warm, a little vintage-craft feeling

finesse: Design Read: specialty coffee · warm vintage craft · register=brand · SPECTACLE=5 · hero-engine=Canvas particles/fire
         (stops and waits for your confirmation)

You: yes, go ahead

finesse: (generates the full page)

You: overall good, but the hero feels too plain, want more impact

finesse: (adjusts only the hero's SPECTACLE, leaves everything else)

You: can you review how this page is doing?

finesse: audit read-only report: ✅ anti-slop blacklist clear ⚠️ mobile touch targets a bit small ⚠️ one contrast issue

You: fix the touch targets first

finesse: (fixes only that)
```

### Example 2: a product dashboard

```
You: An infrastructure monitoring dashboard for the ops team, dark theme

finesse: Design Read: infrastructure monitoring · calm and precise · register=product · SPECTACLE=2 · component-system
         (stops and waits for your confirmation)

You: yes

finesse: (generates a full dashboard: sidebar + charts + data tables)

You: the chart area feels cramped, it's making me dizzy

finesse: densify (reverse) — trims card count, opens up spacing, surfaces the 2-3 most important metrics

You: these pages (monitoring / alerts / settings) need to stay consistent going forward

finesse: (establishes a design-model, records the color/type/component spec, every later page follows it)
```

### Example 3: an e-commerce product page

```
You: A product detail page for a flagship pair of headphones, should feel premium

finesse: Design Read: high-end headphones · precision engineering feel · register=commerce(PDP, brand-leaning) · SPECTACLE=6 · hero-engine=product photography + light parallax
         (stops and waits for your confirmation)

You: yes, go ahead

finesse: (generates the detail page: hero shot + specs + reviews + purchase area)

You: the buy button isn't prominent enough

finesse: (adjusts only the CTA button's visual weight, leaves everything else)
```

---

## 7. FAQ

**Q: I don't know any design terminology, I can only say "looks good / doesn't look good" — is that okay?**
Yes, but the more specific the better. Swap "doesn't look good" for something with more direction, like "feels dated" or "too flashy" — the more information finesse has, the more accurate the first draft is, and the fewer rounds of rework you need.

**Q: I can't edit code at all — what if something's wrong?**
Just describe the problem to it ("this part doesn't display fully on mobile") — you don't need to understand the code, finesse locates and fixes the issue itself.

**Q: Do I have to confirm the Design Read? Can I just have it do everything in one shot?**
You can skip it by saying "whatever you decide, just do it" — but it's not recommended. That step takes a few seconds and avoids a costly redo if the direction turns out completely wrong.

**Q: My multi-page project has drifted out of consistency — can it still be fixed?**
Yes. Say "check whether these pages are visually consistent" — finesse compares the existing pages, reverse-engineers a spec, and adjusts the pages that drifted — no need to rebuild everything.

**Q: Which tool should I use (Claude Code / Cursor / Codex / Copilot)?**
All are supported — installation steps are in the main README's "Install & tool support" section. The usage described in this document is identical across every tool.

---

## 8. One-page cheat sheet

| I want to… | I should say… |
|---|---|
| Build a new page from scratch | Describe the page type + 1-2 mood words |
| Make it more impactful | "more impact" / "too plain" |
| Tone it down | "too flashy" / "overwhelming" |
| Change the style direction | "feels off" / "not our vibe" |
| Add/reduce content density | "too sparse" / "too cluttered" |
| Add a 3D interaction | "add a 3D moment" |
| Fix just one small thing | Name the exact piece and describe the problem |
| Keep multiple pages consistent | "these pages need to share a consistent look" |
| Plug into an existing codebase | "check what design system is already in use here" |
| Do a pre-ship check | "check this page for me" / `audit` |

---

The deeper technical rules (register-detection logic, chart selection, component-system details, the specific entries in the anti-slop blacklist) live in `skills/finesse-ui/` — they're for the Skill to read, not for you to study. This checklist is all you actually need.
