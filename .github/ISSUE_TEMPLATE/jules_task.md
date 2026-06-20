---
name: Jules Agent Task
about: Assigns an autonomous coding task to the Jules AI agent
title: '[JULES] '
labels: 'jules'
assignees: ''
---

<!--
  JULES TASK TEMPLATE
  ===================
  This issue will be picked up and executed by the Jules AI coding agent.
  Fill out every section precisely — Jules uses this as its execution spec.
  Branch naming MUST follow the convention: jules/<loop-name>-<short-slug>
-->

## 🤖 Jules Execution Spec

### Branch
<!-- Jules MUST create and work on this branch. Never commit directly to master or feature/dashboard-audit-fixes. -->
```
Branch: jules/<loop-name>-<short-slug>
Base:   <master | feature/dashboard-audit-fixes>
```

### Commit Convention
<!-- All commits MUST follow Conventional Commits (https://www.conventionalcommits.org/) -->
- `feat(scope):` — new functionality
- `fix(scope):` — bug fix
- `test(scope):` — adding or fixing tests
- `chore(scope):` — cleanup, dependency pruning, dead code removal
- `docs(scope):` — wiki, README, inline comment updates
- `refactor(scope):` — non-breaking restructuring

> **Rule:** Every commit message MUST reference this issue number: `(#<issue-number>)`
> Example: `fix(bcc): replace .dict() with .model_dump() (#42)`

### Code Comment Requirements
<!-- Jules MUST follow these inline documentation standards -->
- **Python**: Docstrings on every public function/class (Google style). Inline `# NOTE:` / `# FIXME:` / `# SECURITY:` prefixes where applicable.
- **Rust**: `///` doc comments on every `pub fn` and `pub struct`. `// SAFETY:` on any `unsafe` block.
- **Solidity**: NatSpec (`@notice`, `@param`, `@return`) on every `external`/`public` function. `// AUDIT:` prefix on any access-control logic.
- **TypeScript/React**: JSDoc on all exported functions and components. Inline comments on non-obvious state logic.

---

## 📋 Task Description
<!-- What is the goal of this task? Be precise. -->


## 🎯 Scope
<!-- Enumerate exactly which files/directories Jules is allowed to modify -->
- [ ] 

## 📐 Acceptance Criteria
<!-- Jules considers the task done only when ALL of these are checked -->
- [ ] All existing tests still pass
- [ ] New code has inline comments per the standards above
- [ ] Commits reference this issue number
- [ ] PR description is filled out using the PR template
- [ ] `docs/wiki/WIKI_LOG.md` updated with a one-line summary entry

## 🚫 Out of Scope
<!-- What Jules must NOT touch -->
- Do not modify files outside the listed scope
- Do not alter existing test behavior (only add or fix)
- Do not merge the PR — leave it open for human review

## 🔗 Related
<!-- Link to spec, wiki page, or upstream issue -->
- Spec: `INTEGRITY_MASTER_SPECIFICATION.md`
- Wiki: `docs/wiki/`
