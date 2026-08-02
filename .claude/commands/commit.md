# commit

## Objective

Stage and commit unstaged work: `git status` / `git diff`, plan minimal commits, run `git add` + `git commit` via `run_terminal_cmd` with `required_permissions: ["all"]` (hooks need npm; avoid `git_write` only).

## Requirements

- **No `--no-verify`** on commit or push unless the user explicitly allows bypass.
- **Do not** run full-project `eslint`, `tsc`, or `test:all` before committing as a fixed ladder—hooks cover that path; fix output from failed hooks instead.
- Use `run_terminal_cmd` for git—no paste-only command blocks.
- One logical commit at a time; stop on failure, fix, retry.
- **File deletions last**, after the rest is committed and hooks pass.

## Grouping

The unit is the **smallest buildable change that could independently break**, not the
smallest buildable change. Optimize for a clean revert: if two edits can only fail together,
they belong in one commit; if either could fail on its own, split them.

- A definition and its first use ship together — a new constant, type, or helper plus the
  call site that introduces it is **one** commit, not two. Alone, the definition is dead code
  and reverting it proves nothing.
- A second, unrelated use of that same helper is a **separate** commit — it can break on its
  own.
- Splitting past the break boundary is as wrong as bundling past it. Do not manufacture
  commits that cannot fail.
- Order: commit dependencies before dependents; keep related edits together.
- Never commit-only-imports, orphan formatting, or partial broken states alone.

Ask per commit: _if this turns out to be wrong, is this exactly what I would revert?_ If the
answer needs a qualifier, the boundary is wrong.

## Messages

`<action> <what>` — lowercase start, imperative, specific (e.g. `fix cart total when discount is zero`).

## Steps

1. Analyze: `git status`, `git diff`.
2. Plan commit boundaries (grouping above).
3. For each commit: `git add … && git commit -m '…'` (no `--no-verify`). On hook failure, fix and retry.
4. Summarize: messages and count; confirm success.

If push is requested: `git push` with same permissions; fix failures and retry.

If you started `npm run dev` for a failing check, run `npm run kill` when finished.
