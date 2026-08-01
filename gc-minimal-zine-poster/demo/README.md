# GC Minimal Zine Poster Demo

This folder contains the local static research demo for `gc-minimal-zine-poster`.

## Run locally

From a clean checkout of `F:\0730_vscode_claude_project`, start the static server:

```powershell
python -m http.server 43173 --directory F:\0730_vscode_claude_project
```

Open:

```text
http://127.0.0.1:43173/gc-minimal-zine-poster/demo/
```

## Verification commands

From `F:\0730_vscode_claude_project\gc-minimal-zine-poster`:

```powershell
node --test demo/tests/compiler.test.mjs
```

With the static server still running:

```powershell
$env:DEMO_BASE_URL = 'http://127.0.0.1:43173/gc-minimal-zine-poster/demo/'
python F:\0730_vscode_claude_project\gc-minimal-zine-poster\demo\tests\browser-smoke.py
```

The smoke script assumes Python Playwright is already available in the environment used for the demo work. No dependency installation is part of this demo.

## Runtime boundary

The page is static and offline at runtime.

- The four JPEG samples in `demo/assets/generated/` were generated beforehand with the internal Codex image capability.
- The browser only reads local files that are already checked into the repository.
- The page does not call Codex, a backend, or any external API at runtime.

## Validation record

See [docs/frontend-validation.md](docs/frontend-validation.md).
