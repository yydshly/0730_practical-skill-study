---
name: agentic-loop
description: Use when asked to iterate, refine, improve, or verify any non-trivial output. Apply an execute-verify loop with explicit quality gates, independent judgment, and honest stopping conditions. Use instead of blindly re-prompting or accepting a first draft.
---

# Agentic Loop

Iterate with evidence, stop with integrity.

## When to use

- The user says: "make it better", "improve", "refine", "verify", "check", "improve until..."
- You need to fan out independent workstreams and integrate results
- Quality standards are vague ("professional", "production-ready", "good enough")
- An earlier attempt was rejected and you need a systematic revision path

## 1. Lock the task contract

Before writing a single gate, preserve the original request:

```
AUTHORITATIVE TASK
<copy the user's exact request verbatim — do not paraphrase>

Constraints (from request): <list any stated constraints>
Exclusions (from request):  <list any stated exclusions>
Deliverables:              <list explicit outputs>
Done definition:           <stated or reasonable interpretation>
```

Do not replace the subject, relax constraints, expand permissions, or let the verification method become the deliverable.

## 2. Translate ambition into gates

Convert subjective language into observable pass/fail conditions:

```
| Gate label      | Verification method          | Pass condition                          | Evidence |
|-----------------|------------------------------|-----------------------------------------|----------|
| Correctness     | Unit tests + typecheck       | 0 failures                              | npm test |
| Completeness    | Spec vs implementation review | Every spec item has corresponding code  | Review   |
| Performance     | Lighthouse / profiler        | LCP < 2.5s, CLS < 0.1                  | Report   |
| Accessibility   | axe-core automated scan      | 0 violations                            | axe out  |
| Visual fidelity | Side-by-side screenshot      | Matches reference within tolerance      | Image    |
```

- Prefer binary pass/fail over scores
- A "wow" reaction is a signal, never the only gate
- Keep gates proportional to the task — 3 to 7 gates is typical

## 3. Fan out only what is independent

- Fan out only workstreams that are genuinely independent
- Give each worker the task contract and nothing else it doesn't need
- Require every worker to return an artifact or evidence, not a confidence claim
- Keep one owner for coupled edits to avoid racing changes

## 4. Separate making from judging

**Never let the implementer be the sole approver of their own work.**

Give the verifier:
- the task contract
- the acceptance matrix
- the candidate artifact
- the relevant benchmark

Withhold: the implementer's rationale and self-assessment.

Instruct the verifier to find failures first, cite evidence, and return a gate-by-gate verdict.

For blind comparison: anonymize and randomize candidates, compare like with like, keep evaluator blind to candidate identity.

## 5. Match proof to the work type

| Work type | Strongest evidence |
|---|---|
| Code | focused tests, typecheck, build, linter, runtime behavior |
| Visual | rendered output at target sizes, interaction checks |
| Research | primary sources, reproducible calculations, citation checks |
| Writing | factual checks, editorial pass against reference |
| Plans | constraint coverage, dependency checks, failure scenarios |

## 6. Run the loop

```
Repeat:
  1. Produce or improve the candidate
  2. Run every applicable gate
  3. Record pass / fail / blocked with evidence
  4. Route each failure to the responsible workstream
  5. Make the smallest revision addressing the evidence
  6. Re-run the failed gate + any affected regression gates
  7. Integrate only verified work
```

Continue while required gates fail AND a safe, in-scope action can make meaningful progress. Do not churn on the same approach after repeated failure — change the approach or report the blocker.

## 7. Stop honestly

Stop when:
- every required gate passes
- the integrated result still satisfies the original task
- regressions relevant to the changed work have been checked
- evidence supports the final claims
- remaining unknowns are disclosed

Stop as blocked when a required gate depends on missing access, unavailable inputs, new authority, or an infeasible constraint. Name the exact blocker and the minimum next action.

## Quality bar

- Every gate has a named verification method and a binary pass condition
- Every pass/fail has cited evidence (command output, screenshot, artifact)
- Making and judging were assigned to different agents or roles
- The final claims match the collected evidence
- Remaining unknowns are disclosed, not hidden

## Pitfalls

- **Self-judging**: the implementer marks their own work as done without independent verification
- **Weak gates**: "looks good" is not a gate — write observable conditions
- **Churn**: repeating the same approach after it has failed twice
- **Scope creep**: using iteration as an excuse to add out-of-scope features
- **Hypothetical evidence**: citing tests that were not actually run
