# Complete Text Sample Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append a data-driven “from blank space to finished poster” module that compares the raw `bookstore-event` sample with the same image composed with complete event copy.

**Architecture:** Keep the existing scenario gallery and compiler unchanged. Add one `FULL_COPY_SAMPLE` record to `demo/js/data.js`, render a semantic comparison section from `app.js`, and use CSS absolute positioning only for the composed poster text layer. Both panels reference the existing local JPEG; no new image or runtime service is introduced.

**Tech Stack:** Static HTML, CSS, ES modules, Node test runner, existing local JPEG assets.

## Global Constraints

- Use the existing `assets/generated/scenarios/bookstore-event.jpeg` for both panels.
- Keep all copy in `data.js`; render dynamic copy with `textContent` or escaped fragments.
- Show `ORIGINAL SAMPLE` and `FULL COPY SAMPLE` labels so image generation and later typography remain distinct.
- Keep the module after `Scenario Product Gallery` and before the footer.
- Validate the 1440px side-by-side layout and the 1024px stacked layout; mobile refinement is not an acceptance target.
- Do not add backend code, external API calls, remote images, remote fonts, or a browser-time image generator.

---

### Task 1: Add the failing text-sample contract test

**Files:**
- Create: `demo/tests/text-sample.test.mjs`

**Interfaces:**
- Consumes: `FULL_COPY_SAMPLE` from `demo/js/data.js` after Task 2.
- Produces: a repeatable contract for the data record, stable HTML hooks, and the app render mapping.

- [ ] **Step 1: Write the failing test**

Create `demo/tests/text-sample.test.mjs` with these assertions:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FULL_COPY_SAMPLE } from '../js/data.js';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

const hooks = [
  'text-sample',
  'text-sample-original-image',
  'text-sample-composed',
  'text-sample-composed-image',
  'text-sample-eyebrow',
  'text-sample-title',
  'text-sample-date',
  'text-sample-location',
  'text-sample-description',
  'text-sample-footer',
  'text-sample-caption',
];

test('full copy sample contains the approved bookstore event copy', () => {
  assert.equal(FULL_COPY_SAMPLE.scenarioId, 'bookstore-event');
  assert.equal(FULL_COPY_SAMPLE.assetPath, 'assets/generated/scenarios/bookstore-event.jpeg');
  for (const key of ['eyebrow', 'title', 'date', 'location', 'description', 'footer']) {
    assert.ok(FULL_COPY_SAMPLE[key].length > 0, `${key} should be populated`);
  }
});

test('full copy sample exposes stable hooks and render mapping', () => {
  for (const hook of hooks) {
    assert.match(html, new RegExp(`id=["']${hook}["']`), `missing #${hook}`);
  }
  assert.match(app, /FULL_COPY_SAMPLE/);
  assert.match(app, /text-sample-composed-image/);
  assert.match(app, /text-sample-title/);
});
```

- [ ] **Step 2: Run the new test to verify the expected RED state**

Run:

```powershell
node --test demo/tests/text-sample.test.mjs
```

Expected: FAIL because `FULL_COPY_SAMPLE` is not exported and the new hooks are not present yet.

- [ ] **Step 3: Commit the failing test**

```powershell
git add demo/tests/text-sample.test.mjs
git commit -m "test: define complete text sample contract"
```

### Task 2: Add the data record and renderer mapping

**Files:**
- Modify: `demo/js/data.js`
- Modify: `demo/js/app.js`

**Interfaces:**
- Consumes: `FULL_COPY_SAMPLE` with `scenarioId`, `assetPath`, `eyebrow`, `title`, `date`, `location`, `description`, and `footer`.
- Produces: `renderTextSample()` that fills the stable hooks and keeps the existing scenario/compiler state untouched.

- [ ] **Step 1: Add the minimal data record**

Append this export to `demo/js/data.js`:

```js
export const FULL_COPY_SAMPLE = {
  scenarioId: 'bookstore-event',
  assetPath: 'assets/generated/scenarios/bookstore-event.jpeg',
  eyebrow: 'WEEKEND READING SESSION',
  title: '闭店之后，读一会儿',
  date: '9月14日 周六 · 19:30',
  location: 'OLD BOOKSTORE / ROOM 02',
  description: '带一本正在读的书来，交换一个不急着结束的晚上。',
  footer: 'BOOKSTORE 02 · AFTER HOURS READING',
};
```

- [ ] **Step 2: Import the record and add DOM references**

Update the app import and `dom` object:

```js
import {
  ASSET_MANIFEST,
  INPUT_PRESETS,
  SCENARIO_SHOWCASES,
  FULL_COPY_SAMPLE,
} from './data.js';
```

Add references for the original image, composed image, six copy nodes, and caption using the exact IDs in Task 1.

- [ ] **Step 3: Implement the renderer**

Add `renderTextSample()` using `textContent` for every copy field and `assetPath` for both image sources:

```js
function renderTextSample() {
  const sample = FULL_COPY_SAMPLE;
  dom.textSampleOriginalImage.src = sample.assetPath;
  dom.textSampleOriginalImage.alt = `${sample.scenarioId} original generated sample`;
  dom.textSampleComposedImage.src = sample.assetPath;
  dom.textSampleComposedImage.alt = `${sample.scenarioId} composed poster sample`;
  dom.textSampleEyebrow.textContent = sample.eyebrow;
  dom.textSampleTitle.textContent = sample.title;
  dom.textSampleDate.textContent = sample.date;
  dom.textSampleLocation.textContent = sample.location;
  dom.textSampleDescription.textContent = sample.description;
  dom.textSampleFooter.textContent = sample.footer;
  dom.textSampleCaption.textContent = `${sample.scenarioId} · same local JPEG · typography added in the demo`;
}
```

- [ ] **Step 4: Run the test and existing suites**

Run:

```powershell
node --test demo/tests/text-sample.test.mjs demo/tests/compiler.test.mjs demo/tests/scenarios.test.mjs demo/tests/scenario-gallery.test.mjs
```

Expected: all tests pass; no existing scenario or compiler behavior changes.

- [ ] **Step 5: Commit the data and renderer mapping**

```powershell
git add demo/js/data.js demo/js/app.js
git commit -m "feat: map complete text sample data"
```

### Task 3: Add the comparison markup and desktop-first styling

**Files:**
- Modify: `demo/index.html`
- Modify: `demo/styles.css`

**Interfaces:**
- Consumes: `renderTextSample()` and `FULL_COPY_SAMPLE` from Task 2.
- Produces: a final page section with raw and composed poster panels, visible labels, and readable copy.

- [ ] **Step 1: Add semantic markup after the scenario gallery**

Add `<section id="text-sample" ...>` before the footer. Include an explanatory heading, an original panel with `#text-sample-original-image`, and a composed panel with `#text-sample-composed` containing `#text-sample-composed-image` plus the six text hooks. Add `#text-sample-caption` below the comparison.

- [ ] **Step 2: Add the composed poster layout rules**

Add `.text-sample`, `.text-sample-layout`, `.text-sample-panel`, `.text-sample-poster`, `.text-sample-copy`, and the type hierarchy. Keep both poster frames at `aspect-ratio: 3 / 5`; position the composed text inside the upper and middle paper field so the lower-left reading-table anchor remains visible.

- [ ] **Step 3: Add the 1024px stacked rule**

At the existing desktop breakpoint, change only the new module to one column and cap the composed poster width so the text remains readable without creating horizontal overflow. Do not alter the existing compiler or scenario gallery behavior.

- [ ] **Step 4: Call the renderer during boot**

Call `renderTextSample()` once in `boot()` after `renderScenarioGallery()` and before `runCompile()`. The module is static and must not depend on compiler completion.

- [ ] **Step 5: Run syntax and contract checks**

```powershell
node --check demo/js/app.js
node --check demo/js/data.js
node --test demo/tests/text-sample.test.mjs demo/tests/compiler.test.mjs demo/tests/scenarios.test.mjs demo/tests/scenario-gallery.test.mjs
git diff --check
```

- [ ] **Step 6: Commit the visual module**

```powershell
git add demo/index.html demo/styles.css demo/tests/text-sample.test.mjs
git commit -m "feat: add complete text poster sample"
```

### Task 4: Verify the full page and update handoff notes

**Files:**
- Modify: `demo/docs/frontend-validation.md`
- Modify: `.superpowers/sdd/2026-08-01-gc-minimal-zine-poster-demo/task-scenario-gallery-report.md` when the ignored handoff report is available.

**Interfaces:**
- Consumes: the final text-sample module and all existing scenario/compiler checks.
- Produces: truthful validation notes for the raw-versus-composed comparison.

- [ ] **Step 1: Verify local asset parity**

Run:

```powershell
node --input-type=module -e "import assert from 'node:assert/strict'; import { FULL_COPY_SAMPLE } from './demo/js/data.js'; import { stat } from 'node:fs/promises'; const info = await stat('./demo/' + FULL_COPY_SAMPLE.assetPath); assert.ok(info.size > 0); console.log(FULL_COPY_SAMPLE.scenarioId, FULL_COPY_SAMPLE.assetPath, info.size);"
```

Expected: `bookstore-event assets/generated/scenarios/bookstore-event.jpeg` and a positive byte count.

- [ ] **Step 2: Run browser inspection when the local browser runtime is available**

At 1440px confirm both panels are visible, the two image `src` values match, and all six copy fields are visible. At 1024px confirm the new section stacks without horizontal overflow. If the in-app browser runtime fails before connecting, record the exact error in the validation note and do not claim screenshot evidence.

- [ ] **Step 3: Update the validation note**

Append the fixed copy, asset path, test command, and browser evidence status to `demo/docs/frontend-validation.md`. Keep the distinction explicit: the image is a pre-generated local sample and the text is a later HTML/CSS composition.

- [ ] **Step 4: Run the final test command**

```powershell
node --test demo/tests/compiler.test.mjs demo/tests/scenarios.test.mjs demo/tests/scenario-gallery.test.mjs demo/tests/text-sample.test.mjs
git diff --check
```

- [ ] **Step 5: Commit the validation note**

```powershell
git add demo/docs/frontend-validation.md
git commit -m "docs: validate complete text sample"
```

## Plan self-review

- Coverage: data, renderer, semantic markup, desktop/1024 styling, tests, local asset parity, and validation notes are each assigned to a task.
- Placeholder scan: every implementation step has concrete files, fields, commands, and expected outcomes.
- Interface consistency: `FULL_COPY_SAMPLE` and all DOM IDs are defined in Task 1/2 before later tasks consume them.
- Scope: no new image generation, backend, editor, or unrelated refactor is included.
