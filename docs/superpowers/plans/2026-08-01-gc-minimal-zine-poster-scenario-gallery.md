# GC Minimal Zine Poster Scenario Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a desktop-first scenario product gallery to the existing static Demo, with ten clearly described use cases and ten independent real Codex-generated local poster samples.

**Architecture:** Keep the existing deterministic compiler and three-column research lab unchanged. Add data-driven `SCENARIO_SHOWCASES` records to `data.js`, register ten new JPEGs in the existing local manifest, and render a new `scenario-gallery` section from `app.js`; the browser only reads checked-in assets and never calls Codex or an external API.

**Tech Stack:** Native HTML, CSS, and JavaScript modules; Node `node:test`; Python Playwright browser smoke; internal Codex image generation used ahead of time for local JPEG assets.

## Global Constraints

- Preserve the existing Prompt Compiler, Recipe, Quality Gate, four base generated samples, upstream Skill files, and outer Project 05 index link.
- Add exactly ten scenarios and exactly one independent generated JPEG per scenario under `demo/assets/generated/scenarios/`.
- Use the approved scenario catalog and copy from `docs/superpowers/specs/2026-08-01-gc-minimal-zine-poster-scenario-gallery-design.md`.
- Only desktop widths 1440px and 1024px are new acceptance targets; do not spend scope on mobile-specific refinement in this iteration.
- Each scenario image must be a real non-empty local JPEG generated ahead of time with the internal Codex image capability, not a CSS placeholder or reused base asset.
- Keep the runtime boundary static/offline: no backend, API key, network image, remote font, browser-time Codex call, or fake “generating” status.
- Every scenario card must explain audience, product, brief, visual goal, fit, and deliverables; the active detail must show the corresponding real image and metadata.
- Use TDD for new browser behavior: write the scenario assertions, run them red, then implement the minimal data/UI changes and run them green.
- Keep scenario UI data-driven; do not hard-code ten independent render branches in `app.js`.

---

### Task 1: Add the scenario catalog and data contract

**Files:**
- Create: `gc-minimal-zine-poster/demo/tests/scenarios.test.mjs`
- Modify: `gc-minimal-zine-poster/demo/js/data.js`

**Interfaces:**
- `data.js` exports `SCENARIO_SHOWCASES`, an array of ten records with `id`, `category`, `audience`, `product`, `brief`, `visualGoal`, `whyItFits`, `deliverables`, `assetId`, and `accentColor`.
- Each `assetId` equals its scenario `id`: `indie-zine-cover`, `bookstore-event`, `cafe-seasonal`, `art-exhibition`, `poetry-book`, `music-ep-cover`, `museum-culture`, `film-title-card`, `art-direction`, or `postcard-insert`.
- Existing `INPUT_PRESETS`, `VARIATION_RECIPES`, `QUALITY_RULES`, and `ASSET_MANIFEST` exports remain unchanged in shape.

- [ ] **Step 1: Write the failing catalog tests**

Add tests that assert the new real contract, not just source text:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIO_SHOWCASES } from '../js/data.js';

test('provides ten distinct scenario product records', () => {
  assert.equal(SCENARIO_SHOWCASES.length, 10);
  assert.equal(new Set(SCENARIO_SHOWCASES.map((item) => item.id)).size, 10);
  for (const item of SCENARIO_SHOWCASES) {
    assert.ok(item.audience.length > 0);
    assert.ok(item.product.length > 0);
    assert.ok(item.brief.length > 0);
    assert.ok(item.visualGoal.length > 0);
    assert.ok(item.whyItFits.length > 0);
    assert.ok(item.deliverables.length >= 2);
    assert.equal(item.assetId, item.id);
  }
});

test('scenario records use the approved product situations', () => {
  assert.deepEqual(SCENARIO_SHOWCASES.map((item) => item.id), [
    'indie-zine-cover', 'bookstore-event', 'cafe-seasonal',
    'art-exhibition', 'poetry-book', 'music-ep-cover',
    'museum-culture', 'film-title-card', 'art-direction',
    'postcard-insert',
  ]);
});
```

- [ ] **Step 2: Run the scenario tests to verify the expected RED state**

Run from `F:\0730_vscode_claude_project\gc-minimal-zine-poster`:

```powershell
node --test demo/tests/scenarios.test.mjs
```

Expected: FAIL because `SCENARIO_SHOWCASES` is not exported yet. Fix only import or test syntax if the failure is not an absent implementation.

- [ ] **Step 3: Add the ten literal scenario records**

Add the exact approved IDs and corresponding concise Chinese descriptions from the design spec. Set each `assetId` equal to its scenario `id` and give it one exact accent color. Keep copy in data, not in DOM rendering branches.

- [ ] **Step 4: Run focused and existing tests**

```powershell
node --test demo/tests/scenarios.test.mjs
node --test demo/tests/compiler.test.mjs
```

Expected: the scenario suite passes with 2 tests and the compiler suite remains 6/6 green.

- [ ] **Step 5: Inspect the diff and commit the data contract**

Run:

```powershell
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster diff --check
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster add demo/js/data.js demo/tests/scenarios.test.mjs
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster commit -m "feat: define scenario product catalog"
```

Stage only the two listed nested-repository files.

---

### Task 2: Generate and register ten real scenario poster samples

**Files:**
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/indie-zine-cover.jpeg`
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/bookstore-event.jpeg`
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/cafe-seasonal.jpeg`
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/art-exhibition.jpeg`
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/poetry-book.jpeg`
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/music-ep-cover.jpeg`
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/museum-culture.jpeg`
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/film-title-card.jpeg`
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/art-direction.jpeg`
- Create: `gc-minimal-zine-poster/demo/assets/generated/scenarios/postcard-insert.jpeg`
- Modify: `gc-minimal-zine-poster/demo/js/data.js`
- Modify: `gc-minimal-zine-poster/demo/assets/generated/manifest.json`

**Interfaces:**
- Every scenario asset row contains `id`, `scenarioId`, `sourceTheme`, `assetPath`, `prompt`, `recipeId`, `accentColor`, `generatedAt`, and `note`.
- `assetPath` is relative to `demo/` and follows `assets/generated/scenarios/<id>.jpeg`.
- The `SCENARIO_SHOWCASES.assetId` value matches the manifest row `id` and the JPEG basename exactly.

- [ ] **Step 1: Generate the ten images with internal Codex**

Use the image-generation capability ahead of time, one independent 3:5 portrait JPEG per scenario. Every prompt must preserve Standard Mode requirements and the shared hard avoids. Use these scene-specific visual anchors:

1. `indie-zine-cover`: rain-softened library card on a quiet old bookstore window, cobalt blue anchor.
2. `bookstore-event`: a small lit reading table after closing, tomato-red book spine, empty paper for event title.
3. `cafe-seasonal`: shell and cold brew on a seaside café counter, lemon-yellow receipt or napkin as the only chromatic anchor.
4. `art-exhibition`: two weather fragments after a typhoon, opaque ultramarine panel as a conceptual anchor.
5. `poetry-book`: isolated night door with a magenta paper edge, restrained literary cover mood.
6. `music-ep-cover`: small seaside radio and tide mark, cobalt-blue signal block, quiet nocturnal rhythm.
7. `museum-culture`: one worn local object on archival paper, tomato-red catalog mark, museum editorial restraint.
8. `film-title-card`: half-seen night entrance and a lemon-yellow threshold mark, cinematic tension without cinematic lighting.
9. `art-direction`: cobalt swatch, torn paper, window fragment and type specimen arranged as a sparse direction board.
10. `postcard-insert`: small wrapped object and handwritten-like mark on warm paper, ultramarine thank-you accent.

For each prompt include: `3:5 vertical aged paper`, `70%–90% negative space`, `one clear visual anchor`, one saturated hue, print/scan texture, and the explicit hard avoids. Do not request clean long text because generated text is not the deliverable.

- [ ] **Step 2: Inspect all ten images at thumbnail size**

Confirm each file is non-empty, portrait-oriented, has a recognizable subject, a visible main accent, and an obvious paper/print field. Regenerate only a weak sample with stronger anchor wording; do not silently reuse one of the four base assets.

- [ ] **Step 3: Create the manifest and connect data records**

Add ten manifest rows with the exact prompt used for each image. Extend `ASSET_MANIFEST` in `data.js` without changing existing base asset rows. Ensure scenario rows are filtered separately by `scenarioId` so existing poster switcher behavior remains unchanged.

- [ ] **Step 4: Run asset integrity checks**

```powershell
Get-ChildItem demo/assets/generated/scenarios -File | Select-Object Name,Length
node --test demo/tests/scenarios.test.mjs
node --test demo/tests/compiler.test.mjs
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster diff --check
```

Expected: ten JPEG files with non-zero sizes, all manifest/data joins resolvable, and existing tests green.

- [ ] **Step 5: Commit the generated assets and manifest**

```powershell
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster add demo/assets/generated/scenarios demo/assets/generated/manifest.json demo/js/data.js
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster commit -m "feat: add real scenario poster samples"
```

Do not stage generated reports or unrelated outer files.

---

### Task 3: Build the desktop scenario gallery with browser-first TDD

**Files:**
- Modify: `gc-minimal-zine-poster/demo/index.html`
- Modify: `gc-minimal-zine-poster/demo/styles.css`
- Modify: `gc-minimal-zine-poster/demo/js/app.js`
- Modify: `gc-minimal-zine-poster/demo/tests/browser-smoke.py`

**Interfaces:**
- `app.js` imports `SCENARIO_SHOWCASES` and filters scenario assets from `ASSET_MANIFEST` by `scenarioId`.
- `renderScenarioGallery()` renders the ten buttons into `#scenario-grid` and calls `renderScenarioDetail(activeScenario)`.
- `renderScenarioDetail(scenario)` updates `#scenario-active-category`, `#scenario-active-title`, `#scenario-active-description`, `#scenario-active-product`, `#scenario-active-brief`, `#scenario-active-why`, `#scenario-active-deliverables`, `#scenario-active-image`, and `#scenario-active-caption` from one data record and its manifest row.
- The new section root is `#scenario-gallery`; cards use `data-scenario-id` and `aria-pressed`.

- [ ] **Step 1: Add browser RED assertions before production markup**

Extend `browser-smoke.py` with these checks after the existing initial route checks and before the dialog check:

```python
print("step: scenario gallery")
scenario_grid = page.locator("#scenario-grid")
assert scenario_grid.locator("[data-scenario-id]").count() == 10
assert page.locator("#scenario-active-title").inner_text().strip()
assert "/assets/generated/scenarios/" in (
    page.locator("#scenario-active-image").get_attribute("src") or ""
)

scenario_buttons = scenario_grid.locator("[data-scenario-id]")
scenario_buttons.nth(6).click()
wait_until(
    lambda: page.locator("#scenario-active-title").inner_text().strip() == "博物馆文化主题海报",
    "Expected scenario detail to update after selecting the museum scenario",
)
assert "博物馆" in page.locator("#scenario-active-product").inner_text()
assert "museum-culture.jpeg" in (
    page.locator("#scenario-active-image").get_attribute("src") or ""
)

scenario_buttons.nth(2).focus()
page.keyboard.press("Enter")
wait_until(
    lambda: "咖啡馆" in page.locator("#scenario-active-title").inner_text(),
    "Expected Enter to activate the focused scenario card",
)
```

- [ ] **Step 2: Run the browser test to verify RED**

With the canonical server at `http://127.0.0.1:43173/`, run:

```powershell
python demo/tests/browser-smoke.py
```

Expected: FAIL at `#scenario-grid` because the new section does not exist yet. Record the expected missing-locator failure before adding production markup.

- [ ] **Step 3: Add semantic scenario markup**

Insert a section after `</main>` and before the existing footer with:

```html
<section id="scenario-gallery" class="scenario-gallery" aria-labelledby="scenario-gallery-title">
  <div class="scenario-heading">
    <p class="panel-kicker">Use Cases / Product Scenarios</p>
    <h2 id="scenario-gallery-title">它可以被用在哪里？</h2>
    <p>从一本独立杂志到一张包装插页，每张卡都连接一个真实产品场景和一张本地生成样张。</p>
  </div>
  <div class="scenario-layout">
    <div id="scenario-grid" class="scenario-grid" role="list" aria-label="Scenario product gallery"></div>
    <article id="scenario-detail" class="scenario-detail" aria-live="polite">
      <div class="scenario-detail-copy">
        <p id="scenario-active-category" class="panel-kicker"></p>
        <h3 id="scenario-active-title"></h3>
        <p id="scenario-active-description"></p>
        <dl>
          <div><dt>Product</dt><dd id="scenario-active-product"></dd></div>
          <div><dt>Input</dt><dd id="scenario-active-brief"></dd></div>
          <div><dt>Why it fits</dt><dd id="scenario-active-why"></dd></div>
        </dl>
        <div>
          <p class="panel-kicker">Deliverables</p>
          <ul id="scenario-active-deliverables"></ul>
        </div>
      </div>
      <figure>
        <img id="scenario-active-image" alt="" />
        <figcaption id="scenario-active-caption"></figcaption>
      </figure>
    </article>
  </div>
</section>
```

Use the exact stable hooks shown above; do not put dynamic scenario data into unchecked HTML.

- [ ] **Step 4: Implement data-driven rendering**

Add a scenario asset map and render functions. Each card must be a native button with a visible category, product, one-line brief, `data-scenario-id`, and `aria-pressed`. Use an existing `escapeHTML()` helper for dynamic values. When selecting a scenario, update the active detail and set exactly one card active; do not modify compiler state or the existing base asset switcher state.

- [ ] **Step 5: Add desktop-first styling**

Add styles for `scenario-gallery`, `scenario-heading`, `scenario-layout`, `scenario-grid`, `scenario-card`, `scenario-card.is-active`, `scenario-detail`, `scenario-detail-copy`, and `scenario-detail-figure`. At 1440px use a 10-card grid beside the detail panel; at 1024px stack the grid above the detail panel. Reuse existing paper/graphite tokens, preserve visible focus states, keep the real image as the focal point, and avoid a new horizontal scrollbar. Do not add mobile-specific breakpoints or redesign the existing panels.

- [ ] **Step 6: Run the full browser journey and compiler suites**

```powershell
node --test demo/tests/scenarios.test.mjs
node --test demo/tests/compiler.test.mjs
python demo/tests/browser-smoke.py
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster diff --check
```

Expected: scenario browser assertions pass at the canonical desktop route; existing compile, copy, hostile-input, empty-focus, variation, and dialog checks remain green.

- [ ] **Step 7: Commit the gallery implementation**

```powershell
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster add demo/index.html demo/styles.css demo/js/app.js demo/tests/browser-smoke.py
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster commit -m "feat: add scenario product gallery"
```

---

### Task 4: Capture desktop scenario evidence and update handoff documentation

**Files:**
- Create: `gc-minimal-zine-poster/demo/docs/evidence/scenario-gallery-1440.png`
- Create: `gc-minimal-zine-poster/demo/docs/evidence/scenario-selected-1440.png`
- Create: `gc-minimal-zine-poster/demo/docs/evidence/scenario-gallery-1024.png`
- Modify: `gc-minimal-zine-poster/demo/docs/frontend-validation.md`
- Create: `gc-minimal-zine-poster/.superpowers/sdd/2026-08-01-gc-minimal-zine-poster-demo/task-scenario-gallery-report.md`

**Interfaces:**
- Evidence screenshots use the canonical URL and actual local scenario JPEGs.
- Validation documentation states desktop-only acceptance for this iteration, ten generated samples, scenario interaction checks, and the runtime API defer.

- [ ] **Step 1: Start the canonical static server and capture default gallery**

Use a real browser at 1440px wide, wait for the initial compiler and scenario gallery to reach ready state, and save `scenario-gallery-1440.png`. The screenshot must show the gallery heading, multiple scenario cards, active detail panel, and a real scenario image.

- [ ] **Step 2: Capture a selected scenario state**

Select the museum scenario (the seventh card) and save `scenario-selected-1440.png`. Confirm the title, product description, and image all correspond to `museum-culture`.

- [ ] **Step 3: Capture the 1024px layout**

Use a real browser at 1024px wide and save `scenario-gallery-1024.png`. Confirm the scenario gallery remains readable and has no horizontal overflow.

- [ ] **Step 4: Update the validation record**

Add a scenario gallery section with the ten scenario IDs, screenshot filenames, exact viewport sizes, selected-state evidence, generated asset counts, and commands/results. Explicitly state that mobile refinement is out of scope for this iteration while the page avoids deliberate horizontal overflow.

- [ ] **Step 5: Run final scenario checks and commit evidence**

```powershell
node --test F:\0730_vscode_claude_project\gc-minimal-zine-poster\demo\tests\scenarios.test.mjs
node --test F:\0730_vscode_claude_project\gc-minimal-zine-poster\demo\tests\compiler.test.mjs
$env:DEMO_BASE_URL = 'http://127.0.0.1:43173/gc-minimal-zine-poster/demo/'
python F:\0730_vscode_claude_project\gc-minimal-zine-poster\demo\tests\browser-smoke.py
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster diff --check
```

Record screenshot dimensions and test exits in the task report. Commit only evidence, validation doc, and the ignored report if the repository policy requires the report to remain outside the product commit.

---

## Self-review checklist

- [ ] All ten approved scenarios appear in data, UI cards, manifest rows, and evidence notes.
- [ ] Every scenario maps to its own non-empty real JPEG; no base asset is reused for scenario cards.
- [ ] The Prompt Compiler and existing browser journey remain unchanged in behavior.
- [ ] Desktop 1440px and 1024px states are verified with real browser screenshots.
- [ ] Dynamic scenario copy is escaped or assigned with `textContent`; no untrusted data is injected into HTML.
- [ ] The runtime boundary remains static/offline and is documented in the validation record.
- [ ] Every task has concrete steps and an owned verification path; no incomplete placeholder step remains.
- [ ] Nested Skill repository and outer research repository are never staged together.
