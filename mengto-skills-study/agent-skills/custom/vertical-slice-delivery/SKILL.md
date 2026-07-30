---
name: vertical-slice-delivery
description: Use when starting a multi-component project — a web app, game, system, or any software with interconnected parts. Deliver one complete end-to-end capability at a time, each with a working demo and stable integration path. Prevent half-built systems that can't be demonstrated or tested.
---

# Vertical Slice Delivery

Ship complete, demonstrable capability slices. Never build four half-finished systems simultaneously.

## When to use

- Starting a new project with multiple components (frontend + backend + auth + database)
- A project has stalled because everything is "in progress" with nothing working end-to-end
- You need to show a stakeholder a demo but only have disjointed components
- A team is parallelizing work but integration is always painful at the end

## 1. Define the first slice

A slice = one coherent user-facing capability, complete from data layer to UI.

Identify what the user needs to do first. The first slice answers: "what is the smallest thing that is actually useful and complete?"

```
SLICE 1: <one complete capability>
  User goal: <what the user accomplishes>
  Demo proof: <what we can show>
  Happy path: <main success scenario>
  Failure modes: <how it breaks gracefully>
  Stable before: <nothing — this is slice 1>
```

## 2. Define subsequent slices

```
SLICE 2: <second complete capability>
  Depends on: Slice 1
  Adds: <what this slice adds>
  Demo proof:
  Stable before: Slice 1 integration point

SLICE 3: <third complete capability>
  Depends on: Slice 2
  ...
```

Do not start slice 2 until slice 1 has: a working demo, automated test coverage, and a stable integration point.

## 3. Build each slice with:

```
Phase A — Integration contract
  Define: data shapes, API boundaries, event contracts
  Review with: any team member who will consume this slice
  Lock before: implementation begins

Phase B — Implementation
  Build: the capability end-to-end
  Test: happy path + key failure modes
  Document: integration points for the next slice

Phase C — Validation
  Run: automated tests
  Demo: to a real human (not just self-reviewed)
  Lock: the integration contract for the next slice
```

## 4. Keep slices small enough to complete in one session

If a slice takes more than ~3 focused sessions to complete, it is too large — split it.

A healthy slice:
- Can be explained in one paragraph
- Has a clear "done" state that a non-engineer can verify
- Contains one new system or integration, not three simultaneously

## 5. Integration is a first-class concern

Each slice ships a working integration, not just a component. The integration point is documented before the next slice begins.

```
Slice N ships:
  ✅ The new capability
  ✅ A working demo of the capability
  ✅ Integration points for Slice N+1
  ✅ Updated tests covering the integration
  ❌ A component that doesn't talk to the rest of the system
```

## Quality bar

- Each slice is complete end-to-end (data layer through UI)
- A non-engineer can verify slice completion from the demo
- No slice begins before the previous slice has a working demo
- Integration contracts are documented and reviewed before implementation
- Tests cover the integration path, not just the isolated component

## Pitfalls

- **Parallel trap**: building components A, B, C simultaneously and only integrating at the end
- **Scope bleed**: a slice grows to cover the entire project mid-way through
- **Integration as afterthought**: components work in isolation, break in combination
- **No demo**: a slice is "done" but can't be shown to anyone
- **Skip the contract**: jumping into implementation without agreeing on data shapes first
- **Large slice**: taking 8 sessions to complete one slice — the demo incentive is lost
