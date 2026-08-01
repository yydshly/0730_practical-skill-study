# Gemini Dual Samples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a switchable Gemini-generated image beside every existing portrait-style sample without changing the original sample, prompt, category, search, or copy behavior.

**Architecture:** Each style record keeps its current `image` and adds a same-ID `geminiImage` plus a concise Gemini-result observation. Gemini PNGs live in `assets/styles/gemini/`, and the rendered card/dialog hold a local source selection that swaps only the visual sample and its supporting label. The static bundler remains the sole producer of `js/app.js`.

**Tech Stack:** ES modules, plain HTML/CSS/JavaScript, Node test runner, Python Playwright smoke test, local PNG assets.

## Global Constraints

- Preserve all existing images in `assets/styles/` and do not replace them with Gemini images.
- Store exactly one Gemini PNG for each existing two-digit style number under `assets/styles/gemini/`.
- Do not edit the repository README, the sibling old project, or pre-existing uncommitted files.
- Keep the existing 20 prompts, filters, search behavior, copy buttons, and mobile keyboard flow unchanged.
- Regenerate `js/app.js` only through `npm.cmd run build` after source edits.

---

### Task 1: Define and validate the dual-sample catalog contract

**Files:**
- Modify: `js/styles.js:15-28` and all 20 `defineStyle` entries
- Modify: `js/gallery.js:1-61`
- Modify: `tests/gallery.test.mjs:10-174`
- Modify: `scripts/build-static.mjs` only if the source-bundle list changes

**Interfaces:**
- Consumes: the existing `Style` record `{ id, number, name, category, keywords, description, image, prompt, details }`.
- Produces: `Style` records with `geminiImage: string` and `geminiDescription: string`; `validateCatalog(styles)` returns invalid if either property is missing or not an approved local PNG path.

- [ ] **Step 1: Write the failing catalog tests**

  Extend the fixture and the missing-fields expectation in `tests/gallery.test.mjs` so Gemini data is mandatory and valid catalog entries expose unique Gemini paths:

  ```js
  geminiImage: 'assets/styles/gemini/01-clean-lifestyle.png',
  geminiDescription: 'Gemini 样例保留了窗边阅读和柔和自然光。',
  ```

  Add assertions that an empty `geminiImage` reports `clean-lifestyle 缺少 geminiImage`, an empty `geminiDescription` reports `clean-lifestyle 缺少 geminiDescription`, and a `geminiImage: '../outside.jpg'` reports a malformed Gemini image path.

- [ ] **Step 2: Run the focused tests and confirm the expected failure**

  Run: `npm.cmd test -- --test-name-pattern="Gemini|catalog"`

  Expected: FAIL because `geminiImage` and `geminiDescription` are not yet catalog fields.

- [ ] **Step 3: Add the minimal catalog support**

  Change the style factory signature to:

  ```js
  function defineStyle({ id, number, name, category, keywords, description, image,
    geminiImage, geminiDescription, prompt, scene, outfit, camera, light }) {
    return { id, number, name, category, keywords, description, image,
      geminiImage, geminiDescription, prompt: `${prompt} ${SAFETY}`,
      details: { scene, outfit, camera, light } };
  }
  ```

  In `js/gallery.js`, add both properties to `REQUIRED_TEXT_FIELDS` and use a dedicated matcher that permits only `assets/styles/gemini/<filename>.png` for `geminiImage`. Add a concise, image-derived Gemini observation to every style entry without changing `description` or `prompt`.

- [ ] **Step 4: Run the focused tests and confirm they pass**

  Run: `npm.cmd test -- --test-name-pattern="Gemini|catalog"`

  Expected: PASS; all malformed/missing Gemini-field cases and the 20-style catalog test pass.

- [ ] **Step 5: Commit the catalog contract**

  Stage only `js/styles.js`, `js/gallery.js`, and `tests/gallery.test.mjs`, then create a commit named `feat: add Gemini sample catalog fields` if the working tree permits an isolated commit.

### Task 2: Collect, map, and verify Gemini image assets

**Files:**
- Create: `assets/styles/gemini/01-clean-lifestyle.png` through `assets/styles/gemini/20-low-key-cinematic.png`
- Modify: `docs/dual-sample-design.md` only to record an unavailable source image, if Gemini has no final output for a style

**Interfaces:**
- Consumes: the current logged-in Gemini conversation and each `Style.geminiImage` path from Task 1.
- Produces: 20 readable portrait PNGs whose basenames exactly match their existing original sample counterparts.

- [ ] **Step 1: Inspect page assets and map final Gemini outputs**

  From the current Gemini conversation, list page assets and map only final generated PNGs to the 20 visible prompt messages. Ignore the transient rate-limit message for style 10 because the succeeding result is the candidate output.

- [ ] **Step 2: Save each mapped image with its canonical name**

  Copy the inspected asset bytes to `assets/styles/gemini/` using the names in the catalog. Do not alter any file in `assets/styles/` outside that new subdirectory.

- [ ] **Step 3: Verify the 20-file mapping before UI integration**

  Run a read-only PNG-header check that reports exactly 20 readable images and their dimensions. Confirm the basenames are the same 01–20 sequence used by `STYLES`.

- [ ] **Step 4: Confirm a sample pair visually**

  Compare style 01 and style 18 in the browser against their Gemini conversation outputs, ensuring each source is a distinct image rather than a duplicate path.

- [ ] **Step 5: Commit the Gemini asset set**

  Stage only `assets/styles/gemini/` and create a commit named `assets: add Gemini portrait samples` if the working tree permits an isolated commit.

### Task 3: Build accessible source switching in cards and the details dialog

**Files:**
- Modify: `index.html:85-103`
- Modify: `js/main.js:5-230`
- Modify: `styles.css:250-455` and responsive rules near `styles.css:485-525`
- Modify: `tests/browser-smoke.py:26-185`

**Interfaces:**
- Consumes: `Style.image`, `Style.description`, `Style.geminiImage`, and `Style.geminiDescription` from Task 1.
- Produces: `renderSample(style, source)` for `source` values `'original' | 'gemini'`, and source-toggle buttons with `data-sample-source`, `aria-pressed`, and a visible source label.

- [ ] **Step 1: Write the failing browser smoke assertions**

  In `exercise_gallery`, add checks that 20 cards expose two source buttons, the initial image source is not inside `/gemini/`, clicking the uniquely scoped Gemini button changes the card image source to `/assets/styles/gemini/`, and clicking the original button restores the original path. Add the same dialog assertion after opening the fantasy card.

  Make evidence capture opt-in so normal test execution cannot overwrite tracked screenshots:

  ```python
  capture = os.environ.get("CAPTURE_EVIDENCE") == "1"
  exercise_gallery(page, "http://127.0.0.1:43173/", capture=capture)
  ```

- [ ] **Step 2: Run browser smoke tests and confirm the expected failure**

  With the static server running on port 43173, run: `npm.cmd run test:browser`

  Expected: FAIL because no source switch buttons or Gemini image paths have been rendered.

- [ ] **Step 3: Implement the smallest switchable presentation**

  Add a reusable source-toggle renderer in `js/main.js`. It must set an active original sample at first render, then update only the active image `src`, `alt`, source label, and the Gemini observation when `data-sample-source="gemini"` is selected. Render that control on each card and in the dialog; do not attach it to the card’s detail-opening button, so a source change does not open the dialog.

  Add `#dialog-sample-toggle` and `#dialog-sample-note` below the dialog image in `index.html`. Use CSS for a two-button segmented control with adequate contrast, a visible focus ring, no horizontal overflow at 390px, and a clear active state.

- [ ] **Step 4: Build and run tests to confirm the implementation passes**

  Run in order:

  ```powershell
  npm.cmd run build
  npm.cmd test
  npm.cmd run test:browser
  ```

  Expected: Node suite passes, browser smoke test passes at desktop 1440, tablet 768, and mobile 390, and evidence files remain unchanged unless `CAPTURE_EVIDENCE=1` is supplied.

- [ ] **Step 5: Commit the switchable UI**

  Stage only `index.html`, `styles.css`, `js/main.js`, `js/app.js`, and `tests/browser-smoke.py`, then create a commit named `feat: switch between original and Gemini samples` if the working tree permits an isolated commit.

### Task 4: Complete visual and regression verification

**Files:**
- Modify: `docs/frontend-validation.md` only if it accurately replaces an existing “formal images unavailable” statement with the verified dual-sample status

**Interfaces:**
- Consumes: the built static page, 40 local PNGs, automated checks, and source-switch controls.
- Produces: recorded verification evidence without changing README or unrelated working-tree files.

- [ ] **Step 1: Inspect both source states in the local browser**

  Open the gallery at `http://127.0.0.1:43173/female-portrait-style-gallery/`, switch styles 01, 10, and 18 to Gemini, then open style 04 and switch it in the dialog. Confirm source labels, image changes, prompt copying, and dialog focus return all work.

- [ ] **Step 2: Run the complete verification commands fresh**

  Run:

  ```powershell
  npm.cmd run build
  npm.cmd test
  npm.cmd run test:browser
  ```

  Expected: all Node tests and all three responsive browser smoke checks pass.

- [ ] **Step 3: Inspect the final working tree scope**

  Run: `git status --short`

  Expected: only the intended Gemini assets, dual-sample source/UI/test files, and the two new planning/design documents are attributable to this feature; preserve all pre-existing changes untouched.

- [ ] **Step 4: Commit the verified documentation status**

  If the validation document changed, stage only that document and create a commit named `docs: record dual sample verification`; otherwise do not create an empty commit.
