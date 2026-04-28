---
name: thinking-before-coding
description: Reduce common AI coding mistakes using Karpathy's principles. Think before coding, prioritize simplicity, make surgical changes, and define success criteria.
---

# Thinking Before Coding

Behavioral guidelines to reduce common LLM coding mistakes. Inspired by Andrej Karpathy's observations on AI coding pitfalls.

**When to use:** Every code change, especially non-trivial tasks.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- **State assumptions explicitly** — If uncertain about requirements, ask first
- **Present alternatives** — If multiple approaches exist, show them. Don't pick silently
- **Push back when warranted** — If a simpler solution exists, recommend it
- **Stop when confused** — Name what's unclear and ask for clarification

**Example:**
```
❌ Bad: Implement authentication without asking about requirements
✅ Good: "I see you need auth. Before I code: are we using JWT, OAuth, or sessions? Should I add refresh tokens?"
```

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

Rules:
- No features beyond what was requested
- No abstractions for single-use code
- No "flexibility" or "configurability" that wasn't asked for
- No error handling for impossible scenarios
- If you write 200 lines and it could be 50, rewrite it

**Self-check:** "Would a senior engineer say this is overcomplicated?" → If yes, simplify.

**Example:**
```
❌ Bad: Generic validation factory with decorators for a single form
✅ Good: Simple validation function that solves the immediate problem
```

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting
- Don't refactor things that aren't broken
- Match existing style, even if you'd code it differently
- If you notice unrelated dead code, mention it — don't delete it

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused
- Don't remove pre-existing dead code unless explicitly asked

**The test:** Every changed line should trace directly to the user's request.

**Example:**
```
❌ Bad: Fix a bug in function A, also refactor function B and update formatting in file
✅ Good: Fix bug in function A only. If you notice function B issues, mention separately
```

---

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform imperative tasks into verifiable goals:

| Task | Transform To |
|------|--------------|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Ensure tests pass before and after" |

For multi-step tasks, state plan with verification:
```
1. [Step 1] → verify: [test/check command]
2. [Step 2] → verify: [test/check command]
3. [Step 3] → verify: [test/check command]
```

Strong success criteria enable independent looping. Weak criteria ("make it work") require constant clarification.

**Example:**
```
❌ Bad: "Add a new endpoint"
✅ Good: "Add a POST /users endpoint that accepts name, email. It should validate email format, reject if duplicate, store in DB, return 201 with ID. Write tests for: valid input, invalid email, duplicate email, success case."
```

---

## Implementation Checklist

Before submitting code:

- [ ] Did I state assumptions or ask clarifying questions?
- [ ] Could this be simpler? (Would a senior engineer approve?)
- [ ] Did I touch only what the request asked for?
- [ ] Did I only clean up my own changes' orphans?
- [ ] Can I verify this meets the success criteria?

---

## Tradeoff Note

These guidelines bias toward **caution over speed**. For trivial tasks (simple typo fixes, one-liners), use judgment — not every change needs full rigor.

Goal: Reduce costly mistakes on non-trivial work, not slow down simple tasks.

---

**You'll know it's working when:**
- Fewer unnecessary changes in diffs
- Fewer rewrites due to overcomplication
- Clarifying questions come before implementation
- Clean, focused PRs with no drive-by "improvements"

---

*Adapted from Andrej Karpathy's observations on LLM coding pitfalls. Originally for Claude Code, adapted for GitHub Copilot.*
