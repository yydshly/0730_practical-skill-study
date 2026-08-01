# Global Sample Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one accessible global control that switches all 20 gallery cards between GPT original images and Gemini images while keeping local comparisons available.

**Architecture:** Store the selected source in the existing gallery state as `original | gemini`. The global control updates every rendered card through its existing local switcher, updates an open dialog directly, and lets future filter/search renders inherit the same source. Refreshing the page starts from `original`.

**Tech Stack:** Plain HTML/CSS/JavaScript, static bundler, Python Playwright smoke tests.

## Global Constraints

- Preserve all existing original and Gemini image files.
- Keep card-level source controls and prompt-copy behavior unchanged.
- Do not add persistence, API calls, dependencies, or changes outside the target project.

### Task 1: Add the regression test

**Files:** `tests/browser-smoke.py`

- [x] Assert one global switcher and one Gemini global button exist.
- [x] Click global Gemini and assert all 20 card image paths use `assets/styles/gemini/`.
- [x] Click global original and assert all 20 card image paths restore original paths.

### Task 2: Implement global source state and control

**Files:** `index.html`, `js/main.js`, `styles.css`

- [x] Add `state.source` with default `original` and a semantic two-button global control.
- [x] Pass `state.source` into new and filtered card renders.
- [x] Update existing card switchers and any open dialog when global source changes.
- [x] Add responsive styling with no horizontal overflow at 390px.

### Task 3: Build and verify

**Files:** `js/app.js`, `docs/frontend-validation.md`, `docs/evidence/global-sample-switcher-preview.png`

- [x] Run `npm.cmd run build`.
- [x] Run `npm.cmd test`.
- [x] Run `npm.cmd run test:browser` at desktop, tablet, and mobile sizes.
- [x] Record the global switcher evidence without modifying README or the sibling project.
