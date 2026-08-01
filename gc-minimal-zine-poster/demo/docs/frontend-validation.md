# Frontend Validation

Date: 2026-08-01
Scope: Task 5 final browser evidence and delivery closure for the static research demo
Canonical route: `http://127.0.0.1:43173/gc-minimal-zine-poster/demo/`

## Status summary

- Final Task 5 evidence was captured from the live local static route with a real Playwright Chromium browser on 2026-08-01.
- The demo remains static HTML/CSS/JavaScript only. It shows pre-generated local JPEG assets and does not call Codex or any external API at runtime.
- Compiler tests, canonical browser smoke, viewport overflow checks at 1440/768/390, and `git diff --check` all completed successfully.
- The browser run required an approved unsandboxed launch because the sandboxed Playwright launch failed with `spawn EPERM`; the captured screenshots and smoke output below are from the successful real-browser rerun.

## Approved design contract

- Entry mode: brief-led research flow.
- Demo boundary: static HTML/CSS/JavaScript only, no backend, no runtime Codex call, no external API call.
- Visual contract: Standard Mode semantics with a vertical 3:5 paper poster, 70%-90% negative space, one clear anchor, one saturated hue, and print/scan texture.
- Information contract: the page exposes compiler fields, prompt output, variation recipe, quality gate, and local generated samples in one place.
- Interaction contract: the primary journey remains usable on desktop, tablet, and mobile, with keyboard-reachable controls and explicit text feedback for empty/copy/dialog states.

## Primary journey

1. Choose a preset seed or type a brief.
2. Click `Compile Prompt`.
3. Review the compiled prompt, recipe, and quality checks.
4. Switch variation or generated sample to compare outcomes.
5. Copy the prompt or open the sample dialog for closer inspection.

## Final screenshot evidence

All screenshots below are non-placeholder local captures from the canonical route and show actual local generated JPEG assets.

| File | Captured state | Asset visible | PNG size | Caption |
| --- | --- | --- | --- | --- |
| `demo/docs/evidence/desktop-1440.png` | 1440px desktop, READY state | `assets/generated/seaside-pause.jpeg` | 1440 × 4107, 1,156,786 bytes | Three-column editorial layout with input, paper poster, compiler panels, prompt, recipe, and quality gate all visible. |
| `demo/docs/evidence/tablet-768.png` | 768px tablet, READY state | `assets/generated/seaside-pause.jpeg` | 768 × 5089, 769,138 bytes | Two-column tablet layout remains readable with the poster still visually prominent. |
| `demo/docs/evidence/mobile-390.png` | 390px mobile, READY state | `assets/generated/seaside-pause.jpeg` | 390 × 7905, 729,674 bytes | Single-column mobile flow from input to prompt/recipe/quality with no horizontal overflow. |
| `demo/docs/evidence/detail-dialog-1440.png` | 1440px desktop, generated-sample dialog open | `assets/generated/rainy-bookstore.jpeg` in dialog | 1440 × 1200, 1,215,745 bytes | Opened original-sample dialog showing the local generated poster detail view. |

## Viewport matrix

| Viewport | Expected layout | Observed browser metrics | Screenshot evidence | Result |
| --- | --- | --- | --- | --- |
| 1440px desktop | three-column editorial workspace | `innerWidth=1440`, `scrollWidth=1440`, `bodyScrollWidth=1440`, READY state, recipe `lower-left-float-ultramarine` | `demo/docs/evidence/desktop-1440.png` | Pass |
| 768px tablet | two-column layout with poster remaining prominent | `innerWidth=768`, `scrollWidth=768`, `bodyScrollWidth=768`, READY state, recipe `lower-left-float-ultramarine` | `demo/docs/evidence/tablet-768.png` | Pass |
| 390px mobile | single-column flow without horizontal overflow | `innerWidth=390`, `scrollWidth=390`, `bodyScrollWidth=390`, READY state, recipe `lower-left-float-ultramarine` | `demo/docs/evidence/mobile-390.png` | Pass |

## State and interaction checks

Browser smoke was rerun on 2026-08-01 against the canonical route with the following observed output:

```text
step: load route
step: initial poster
step: initial prompt
step: preset compile
step: empty input validation
step: restore preset
step: variation
step: copy prompt
step: copy failure
step: dialog escape
```

| State / check | Evidence | Result |
| --- | --- | --- |
| Initial route renders input, poster, prompt, and recipe | Browser smoke: `load route`, `initial poster`, `initial prompt` | Pass |
| Preset -> compile -> READY | Browser smoke: `preset compile` | Pass |
| Empty input shows readable feedback | Browser smoke: `empty input validation` | Pass |
| New Variation changes recipe id | Browser smoke: `variation` | Pass |
| Copy success shows toast | Browser smoke: `copy prompt` | Pass |
| Copy failure keeps prompt selectable and shows failure feedback | Browser smoke: `copy failure` | Pass |
| Dialog opens and Escape closes it | Browser smoke: `dialog escape` | Pass |
| READY screenshot evidence exists for desktop/tablet/mobile | Screenshot set above | Pass |
| Detail dialog screenshot exists with a real local poster open | `demo/docs/evidence/detail-dialog-1440.png` | Pass |

## Keyboard checks

| Keyboard behavior | Evidence | Result |
| --- | --- | --- |
| Escape closes the dialog | Browser smoke `dialog escape` | Pass |
| Focus returns to the dialog opener after Escape | Browser smoke focus-return assertion | Pass |
| Primary controls remain keyboard-reachable native controls (`select`, `textarea`, `button`) | Confirmed from shipped DOM plus real-browser interaction run | Pass |
| Visible focus-state screenshots | Not separately captured in Task 5; no extra focus-style claim beyond the passing interactive browser run | Not separately recorded |

## Generated-asset evidence

The sample viewer is backed by four pre-generated local JPEGs plus a local manifest. Presence was reconfirmed on 2026-08-01 while validating screenshot file output and local asset rendering.

| Asset | Recipe | Accent | Generated at | File size (bytes) |
| --- | --- | --- | --- | ---: |
| `rainy-bookstore.jpeg` | `lower-left-float-cobalt` | cobalt blue | 2026-08-01 | 399876 |
| `seaside-pause.jpeg` | `center-fragment-tomato` | tomato red | 2026-08-01 | 354190 |
| `typhoon-memory.jpeg` | `dual-panel-lemon` | lemon yellow | 2026-08-01 | 415853 |
| `night-door.jpeg` | `upper-right-block-ultramarine` | ultramarine | 2026-08-01 | 436933 |

Manifest source: `demo/assets/generated/manifest.json`

## Commands and results

Canonical local server:

```powershell
python -m http.server 43173 --directory F:\0730_vscode_claude_project
```

Observed result: route served successfully at `http://127.0.0.1:43173/gc-minimal-zine-poster/demo/` with HTTP `200`.

Compiler suite:

```powershell
node --test F:\0730_vscode_claude_project\gc-minimal-zine-poster\demo\tests\compiler.test.mjs
```

Observed result:

```text
1..6
# tests 6
# pass 6
# fail 0
```

Exit code: `0`

Browser smoke:

```powershell
$env:DEMO_BASE_URL = 'http://127.0.0.1:43173/gc-minimal-zine-poster/demo/'
python F:\0730_vscode_claude_project\gc-minimal-zine-poster\demo\tests\browser-smoke.py
```

Observed result: the 10 smoke steps listed in the State and interaction checks section all completed.

Exit code: `0`

Viewport overflow and screenshot capture:

- Real Playwright Chromium run against the canonical route captured `desktop-1440.png`, `tablet-768.png`, `mobile-390.png`, and `detail-dialog-1440.png`.
- Verified PNG widths matched the target widths `1440`, `768`, `390`, and `1440`.
- Verified all four files were non-empty and each viewport reported `scrollWidth == innerWidth`.

Diff hygiene:

```powershell
git -c safe.directory=F:/0730_vscode_claude_project/gc-minimal-zine-poster -C F:/0730_vscode_claude_project/gc-minimal-zine-poster diff --check
```

Observed result: no whitespace errors reported; exit code `0`.

## Explicit defers

- Runtime Codex or external API image generation is intentionally out of scope for this static demo.
- The browser only displays pre-generated local assets already stored under `demo/assets/generated/`.
- No backend, runtime prompt compiler service, or browser-time image generation path was added in this task.

## Scenario product gallery validation (2026-08-01)

This iteration adds a desktop-first scenario product gallery below the existing Prompt Compiler lab. It is data-driven, keeps the original four base assets in the existing switcher, and adds exactly one independent local JPEG for each approved product situation. The browser still performs no image-generation or external API call.

### Scenario catalog

The gallery contains these ten scenario IDs: `indie-zine-cover`, `bookstore-event`, `cafe-seasonal`, `art-exhibition`, `poetry-book`, `music-ep-cover`, `museum-culture`, `film-title-card`, `art-direction`, and `postcard-insert`.

Each selected detail panel shows the audience, product, input example, visual goal, fit rationale, suggested deliverables, scenario ID, generation date, local asset path, and the `GENERATED SCENARIO SAMPLE` label. The cards are native buttons with `aria-pressed`; selection updates the detail panel and the real local image without touching compiler state.

### Generated asset evidence

All ten files are portrait JPEGs at `971 × 1619` (approximately 3:5), non-empty, and stored under `demo/assets/generated/scenarios/`. The local `manifest.json` and `data.js` rows have matching IDs, prompts, scenario IDs, and paths.

| Scenario | Local file | Bytes |
| --- | --- | ---: |
| `indie-zine-cover` | `assets/generated/scenarios/indie-zine-cover.jpeg` | 445,053 |
| `bookstore-event` | `assets/generated/scenarios/bookstore-event.jpeg` | 410,311 |
| `cafe-seasonal` | `assets/generated/scenarios/cafe-seasonal.jpeg` | 342,397 |
| `art-exhibition` | `assets/generated/scenarios/art-exhibition.jpeg` | 357,585 |
| `poetry-book` | `assets/generated/scenarios/poetry-book.jpeg` | 361,395 |
| `music-ep-cover` | `assets/generated/scenarios/music-ep-cover.jpeg` | 341,688 |
| `museum-culture` | `assets/generated/scenarios/museum-culture.jpeg` | 331,767 |
| `film-title-card` | `assets/generated/scenarios/film-title-card.jpeg` | 352,032 |
| `art-direction` | `assets/generated/scenarios/art-direction.jpeg` | 377,422 |
| `postcard-insert` | `assets/generated/scenarios/postcard-insert.jpeg` | 349,789 |

### Automated checks

The following checks pass after the gallery implementation:

```text
node --check demo/js/app.js                 PASS
node --check demo/js/data.js                PASS
node --test demo/tests/compiler.test.mjs demo/tests/scenarios.test.mjs demo/tests/scenario-gallery.test.mjs
11 tests, 11 passed, 0 failed
git diff --check                           PASS
```

## Full-copy text sample validation (2026-08-01)

The final section, `从留白到成品`, demonstrates the practical handoff from a generated visual direction to a usable poster composition:

- The left panel keeps the original `bookstore-event` JPEG unchanged.
- The right panel uses the same local JPEG and adds the complete event copy with HTML/CSS typography.
- The sample copy includes an event eyebrow, Chinese title, date, location, description, and footer.
- The desktop layout places the two states side by side; the existing responsive rule stacks them below the desktop breakpoint.
- No new image-generation call or backend was added; both panels point to `assets/generated/scenarios/bookstore-event.jpeg`.

Automated checks for this addition:

```text
node --test demo/tests/compiler.test.mjs demo/tests/scenarios.test.mjs demo/tests/scenario-gallery.test.mjs demo/tests/text-sample.test.mjs
13 tests, 13 passed, 0 failed
node --check demo/js/app.js                 PASS
node --check demo/js/data.js                PASS
bookstore-event assets/generated/scenarios/bookstore-event.jpeg 410311
```

Browser evidence status: the deliverable was already open in the Codex in-app browser, but the browser security policy rejected both refresh and DOM inspection for the local `file://` URL. No new screenshot or interactive browser result is claimed for this section. The static DOM hooks, data-to-render mapping, asset existence, and responsive CSS rules are covered by the checks above.

## Typography safe-zone repair (2026-08-01)

The supplied composed-poster screenshot showed a local layout collision: the title, metadata rules, description, and footer were all left-aligned across the image's subject area. The source JPEG's usable negative space is concentrated in the upper and right side of the poster.

The repair keeps the copy and image unchanged while moving the composed copy block into an image-specific right-side safe zone. The title is limited to six Chinese characters per line, the description is narrowed, the metadata rules are confined to the copy column, and the footer follows the copy block instead of being pinned over the dark lower image.

Automated repair checks:

```text
node --test demo/tests/text-sample.test.mjs
3 tests, 3 passed, 0 failed
```

Browser retest status: the before-state screenshot was supplied by the user. The in-app browser control still rejects refresh and DOM inspection for the open local `file://` URL, so an after-state screenshot is not claimed. Manual retest trigger: refresh the existing demo tab and inspect the `从留白到成品` right-hand poster; the copy should remain in the clean right-side paper field and no longer cross the bookshelf, lamp, or lower image.

### Browser evidence status

The implementation was opened in the Codex app for inspection, but the in-app browser control runtime was unavailable during this run and failed before connecting with `failed to write kernel assets: 系统找不到指定的路径。` Therefore no new screenshot is claimed for `scenario-gallery-1440.png`, `scenario-selected-1440.png`, or `scenario-gallery-1024.png`. The remaining browser acceptance is specifically to exercise the 1440px default state, the museum selection state, and the 1024px stacked layout once the browser control runtime is available. Mobile refinement remains out of scope for this iteration.
