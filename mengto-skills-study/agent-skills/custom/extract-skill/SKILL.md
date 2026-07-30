---
name: extract-skill
description: Use when asked to turn an article, tutorial, workflow description, or prompt collection into a reusable Agent Skill. Extract the portable mechanism, not the source layout. Use to bootstrap a skill library from external material.
---

# Extract Skill

Turn source material into a portable, reusable skill package.

## When to use

- The user provides an article, tutorial, or prompt collection and asks to "make this into a skill"
- You notice a repeated workflow pattern across multiple projects and want to codify it
- An existing skill is too broad ("mega-skill") and needs拆分成 smaller capabilities
- A team member has tacit knowledge that should become an explicit, shareable artifact

## 1. Inspect before extracting

1. Read the complete source material
2. Identify every explicit step, example, constraint, and acceptance criterion
3. Do not infer a family of skills from a title alone — trace each proposed capability to source evidence
4. Search existing `SKILL.md` files for overlapping capabilities
5. List what will be kept, what will be removed, and why

## 2. Build the extraction ledger

```
| Source element           | Reusable capability     | Keep | Remove | Reason |
|-------------------------|-------------------------|------|--------|--------|
| Step 1: authenticate    | Auth token management   |  ✓   |        |        |
| Step 2: parse response  | Streaming JSON parser    |  ✓   |        |        |
| Brand-specific UI copy  | —                       |       |  ✓     | Theme lock-in |
```

## 3. Extract the portable contract

Keep (transferable mechanics):
- behavior and state transitions
- data model and parameter defaults
- timing, easing, spacing, and responsive rules
- accessibility, reduced-motion, and keyboard behavior
- performance constraints and failure modes
- acceptance checks that prove the result

Remove (source-specific packaging):
- brand names, marketing copy, and proprietary content
- page layout unrelated to the capability
- hard-coded palettes, assets, and selectors
- incidental implementation choices that do not affect the outcome

The result must transfer to a different subject, layout, and visual system without rewriting the core instructions.

## 4. Package the skill

Follow the folder contract:

```
agent-skills/<category>/<skill-name>/
  SKILL.md          # required — imperative form, name + description in frontmatter
  REFERENCES.md     # optional — links only, no big explanations
  ARTICLE.md        # optional — long-form context
  assets/           # optional
  scripts/          # optional
  demo/
    index.html      # required for visual skills
    PROMPT.md       # required for workflow skills
    input.md        # required for workflow skills
    expected-output.md
```

Write `SKILL.md` in imperative form. Keep only `name` and `description` in frontmatter. Put trigger phrases in the description, operational steps and pitfalls in the body.

## 5. Write three example prompts

```
### Minimal prompt
Use $<skill-name> to <capability> on <target>.

### Recreate the demo
Describe the reference experience, implementation contract,
deliverables, and acceptance checks.

### Remix prompt
Change the subject, content, palette, and composition
while preserving the mechanism, accessibility behavior,
and performance contract.
```

## 6. Validate before committing

1. Does the skill work on a different subject than the source?
2. Is the trigger phrase specific enough to fire only when appropriate?
3. Is the skill too broad (mega-skill) or too narrow (micro-fragment)?
4. Are the failure modes documented?
5. Is there a working demo or test case?

## Quality bar

- Each skill does one independently useful thing
- The mechanism transfers to a different subject without rewriting instructions
- Trigger phrases are specific and do not fire accidentally
- A working demo or test proof exists
- Failure modes are documented

## Pitfalls

- **Page clone**: copying the source layout instead of extracting the mechanism
- **Mega-skill**: combining independent capabilities into one vague skill — split by behavior
- **Micro-fragments**: turning every sentence into a skill with no standalone value
- **Theme lock-in**: hard-coding the source palette, assets, or copy
- **Prompt-only package**: omitting a functioning demo and validation
- **No trigger phrase**: description field is empty or generic — the skill never fires
