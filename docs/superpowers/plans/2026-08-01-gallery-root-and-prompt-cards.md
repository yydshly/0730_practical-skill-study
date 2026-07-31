# Gallery Root Delivery and Prompt Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the twenty-style gallery visible from the project root and from a directly opened `index.html`, while showing a copyable prompt summary below every portrait card.

**Architecture:** Keep `js/styles.js` as the single source of catalog content and `js/gallery.js` as the testable pure-function layer. Add a dependency-free build script that converts the existing ES module sources into one classic browser script for both `file://` and HTTP use. Refactor cards into a detail-opening button plus a sibling prompt panel so the copy control remains valid, accessible HTML.

**Tech Stack:** Native HTML/CSS/JavaScript, Node.js built-in test runner and filesystem APIs, Python Playwright with local Chrome, Codex built-in image generation.

## Global Constraints

- The final project must exist at `F:\0730_vscode_claude_project\female-portrait-style-gallery` after local integration.
- Both local HTTP and direct `file://` opening must render twenty cards and nine categories.
- Each card shows a three-to-four-line prompt preview and an independent copy button; the dialog retains the complete prompt.
- Do not modify the existing `female-portrait-director-demo` UI or behavior.
- Do not add a backend, API key, remote font, runtime network request, or third-party JavaScript dependency.
- Generate images with the Codex conversation built-in image tool only; do not switch to local API mode without explicit user authorization.
- Missing formal images remain explicit numbered placeholders and are never reported as completed images.

---

### Task 1: Lock the Two Entry Modes and Prompt-Card Behavior in Browser Tests

**Files:**
- Modify: `female-portrait-style-gallery/tests/browser-smoke.py`

**Interfaces:**
- Consumes: `ROOT`, the existing local HTTP URL, and the rendered `.style-card` collection.
- Produces: `exercise_gallery(page, url, capture=False) -> None`, reusable for HTTP and `file://` entry checks.

- [ ] **Step 1: Write the failing browser assertions**

Refactor the existing journey into `exercise_gallery` and add these assertions before production changes:

```python
def exercise_gallery(page, url, capture=False):
    page.goto(url, wait_until="networkidle")
    expect(page.locator(".style-card").count() == 20, f"{url} 应显示 20 张风格卡片")
    expect(page.locator(".style-card__prompt").count() == 20, "每张卡片应显示提示词摘要")
    expect(page.locator(".card-copy-button").count() == 20, "每张卡片应提供复制按钮")

    first_copy = page.locator(".card-copy-button").first
    first_copy.click()
    expect(not page.locator("#style-dialog").evaluate("element => element.open"), "卡片复制不应打开详情")
    expect("复制" in page.locator("#toast").inner_text(), "卡片复制应显示反馈")
```

Run the same initial assertions for:

```python
exercise_gallery(page, "http://127.0.0.1:43173/", capture=True)
exercise_gallery(page, (ROOT / "index.html").as_uri())
```

- [ ] **Step 2: Run the browser test and verify the expected failure**

Run: `python female-portrait-style-gallery/tests/browser-smoke.py`

Expected: FAIL because `.style-card__prompt` and `.card-copy-button` do not exist; after those are added but before bundling, the `file://` case must still fail to render twenty cards.

- [ ] **Step 3: Commit the failing acceptance test**

```powershell
git add female-portrait-style-gallery/tests/browser-smoke.py
git commit -m "test: require prompt cards and direct file entry"
```

---

### Task 2: Add Prompt Summaries and Independent Copy Controls

**Files:**
- Modify: `female-portrait-style-gallery/js/main.js`
- Modify: `female-portrait-style-gallery/styles.css`

**Interfaces:**
- Consumes: `style.prompt` from every `STYLES` record.
- Produces: `.style-card__prompt`, `.card-copy-button`, and `copyText(text: string) -> Promise<void>`.

- [ ] **Step 1: Refactor the card into valid interactive regions**

Change `createStyleCard` so the detail opener and prompt copy control are siblings rather than nested buttons:

```js
const openButton = document.createElement('button');
openButton.type = 'button';
openButton.className = 'style-card__button';
openButton.addEventListener('click', () => openStyle(style, openButton));

const promptPanel = document.createElement('div');
promptPanel.className = 'style-card__prompt';
const promptText = document.createElement('p');
promptText.textContent = style.prompt;
const copyButton = document.createElement('button');
copyButton.type = 'button';
copyButton.className = 'card-copy-button';
copyButton.textContent = '复制提示词';
copyButton.addEventListener('click', () => copyText(style.prompt));
promptPanel.append(promptText, copyButton);
article.append(openButton, promptPanel);
```

- [ ] **Step 2: Generalize the existing copy implementation**

Replace the dialog-only copy implementation with:

```js
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('提示词已复制');
  } catch {
    // Keep the existing readonly-textarea and execCommand fallback,
    // using `text` rather than `activeStyle.prompt`.
  }
}

function copyPrompt() {
  if (activeStyle) return copyText(activeStyle.prompt);
}
```

- [ ] **Step 3: Add four-line prompt styling and focus states**

Add a bordered secondary panel below each card caption. Clamp the prompt to four lines with `-webkit-line-clamp: 4`, keep the copy button visible, and include `:focus-visible` styling using `--copper-light`. Preserve the 4 / 2 / 1-column breakpoints.

- [ ] **Step 4: Run the browser test and confirm only direct-file entry remains failing**

Run: `python female-portrait-style-gallery/tests/browser-smoke.py`

Expected: HTTP prompt-card and copy assertions PASS; direct `file://` assertion FAIL because ES modules are blocked.

- [ ] **Step 5: Commit the prompt-card behavior**

```powershell
git add female-portrait-style-gallery/js/main.js female-portrait-style-gallery/styles.css
git commit -m "feat: show prompts below portrait cards"
```

---

### Task 3: Build a Classic Script for HTTP and Direct File Opening

**Files:**
- Create: `female-portrait-style-gallery/scripts/build-static.mjs`
- Create: `female-portrait-style-gallery/tests/build-static.test.mjs`
- Create: `female-portrait-style-gallery/js/app.js` (generated and committed)
- Modify: `female-portrait-style-gallery/index.html`
- Modify: `female-portrait-style-gallery/package.json`
- Modify: `female-portrait-style-gallery/README.md`

**Interfaces:**
- Consumes: `js/gallery.js`, `js/styles.js`, and `js/main.js` in that order.
- Produces: `buildClassicBundle({ rootDir }) -> string` and browser-ready `js/app.js` with no `import` or `export` tokens.

- [ ] **Step 1: Write the failing build test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClassicBundle } from '../scripts/build-static.mjs';

test('builds one classic browser script without module syntax', async () => {
  const output = await buildClassicBundle({ rootDir: new URL('../', import.meta.url) });
  assert.match(output, /const STYLES =/);
  assert.match(output, /function filterStyles/);
  assert.match(output, /render\(\);/);
  assert.doesNotMatch(output, /^\s*(import|export)\s/m);
});
```

- [ ] **Step 2: Run the Node test and verify it fails**

Run: `npm.cmd test` from `female-portrait-style-gallery`.

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/build-static.mjs`.

- [ ] **Step 3: Implement the dependency-free bundler**

`buildClassicBundle` must read the three sources, remove only top-level import/export syntax, concatenate in dependency order, and wrap the result in an IIFE:

```js
export async function buildClassicBundle({ rootDir }) {
  const root = fileURLToPath(rootDir);
  const sources = await Promise.all([
    readFile(join(root, 'js/gallery.js'), 'utf8'),
    readFile(join(root, 'js/styles.js'), 'utf8'),
    readFile(join(root, 'js/main.js'), 'utf8'),
  ]);
  const classic = sources.map(stripModuleSyntax).join('\n\n');
  return `(() => {\n'use strict';\n${classic}\n})();\n`;
}
```

When run directly, write the output to `js/app.js`.

- [ ] **Step 4: Switch the page to the generated classic entry**

Change:

```html
<script type="module" src="js/main.js"></script>
```

to:

```html
<script defer src="js/app.js"></script>
```

Add package scripts:

```json
"build": "node scripts/build-static.mjs",
"test": "node --test tests/*.test.mjs"
```

- [ ] **Step 5: Generate the bundle and run all tests**

Run:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:browser
```

Expected: all Node tests pass; both HTTP and `file://` render twenty cards; prompt-copy interaction passes without opening the dialog.

- [ ] **Step 6: Document both supported entry modes**

Update `README.md` so its first option is double-clicking `index.html`, with the local HTTP command as the development/testing option. State that `npm.cmd run build` must be rerun after source JavaScript changes.

- [ ] **Step 7: Commit the static entry**

```powershell
git add female-portrait-style-gallery/index.html female-portrait-style-gallery/js/app.js female-portrait-style-gallery/package.json female-portrait-style-gallery/README.md female-portrait-style-gallery/scripts/build-static.mjs female-portrait-style-gallery/tests/build-static.test.mjs female-portrait-style-gallery/tests/browser-smoke.py
git commit -m "feat: support direct gallery opening"
```

---

### Task 4: Continue the Built-In Image Set and Record Honest Asset Status

**Files:**
- Create: `female-portrait-style-gallery/assets/styles/02-pure-desire-curve.png` through `20-low-key-cinematic.png`, one successful built-in generation at a time.
- Modify: `female-portrait-style-gallery/docs/frontend-validation.md`

**Interfaces:**
- Consumes: the exact prompt for each record in `js/styles.js`.
- Produces: one 2:3 local PNG per style, matching the existing filename contract.

- [ ] **Step 1: Generate each missing asset with one built-in call**

For each style from 02 through 20, issue one `image_gen` call using taxonomy `photorealistic-natural` (or `historical-scene` for period-inspired ancient styles), the record's scene/wardrobe/camera/light details, and the shared adult-safety constraints. Do not use CLI/API fallback after a built-in network failure.

- [ ] **Step 2: Copy each successful output into the project immediately**

Copy from the returned `$CODEX_HOME/generated_images/...` path to the exact `assets/styles/<filename>.png` path. Never overwrite a previously accepted file without explicit user approval.

- [ ] **Step 3: Inspect every generated image**

Use `view_image` and check adult appearance, style match, 2:3 framing, realistic face/hands, complete clothing, and absence of text/logo/watermark. Reject only the failed variant; iterate with one targeted prompt change.

- [ ] **Step 4: Count and validate assets**

Run:

```powershell
Get-ChildItem assets\styles -Filter *.png | Measure-Object
```

Expected when complete: `Count = 20`. If the built-in service remains unavailable, record the exact successful count and leave this task incomplete.

- [ ] **Step 5: Update evidence and commit successful assets**

Update `docs/frontend-validation.md` with the exact count and inspection status, then commit only successful images and the truthful status update:

```powershell
git add female-portrait-style-gallery/assets/styles female-portrait-style-gallery/docs/frontend-validation.md
git commit -m "feat: add generated portrait style assets"
```

---

### Task 5: Final Verification and Local Integration

**Files:**
- Verify: all files under `female-portrait-style-gallery/`
- Merge into: base branch `female-portrait-director-demo`

**Interfaces:**
- Consumes: green Node/browser suite and clean feature branch.
- Produces: `F:\0730_vscode_claude_project\female-portrait-style-gallery` on the base branch.

- [ ] **Step 1: Run the complete verification suite**

From `female-portrait-style-gallery` run:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:browser
node --check js\app.js
git diff --check
```

Expected: zero failures, browser evidence for 1440 / 768 / 390, and no page script errors.

- [ ] **Step 2: Confirm branch state and asset count**

Run `git status --short` and count `assets/styles/*.png`. The branch must be clean; report the image count separately from the twenty catalog records.

- [ ] **Step 3: Use the finishing-a-development-branch workflow**

The user has requested local root delivery. Reconfirm the base branch from Git history, locally merge `codex/female-portrait-style-gallery` into `female-portrait-director-demo`, and run the complete verification suite again from `F:\0730_vscode_claude_project\female-portrait-style-gallery` before removing the owned worktree.

- [ ] **Step 4: Report the root project path and truthful completion state**

Provide the root project link, test results, exact formal-image count, and any remaining built-in image service blocker. Do not describe placeholders as generated samples.
