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

- Default: one file per commit unless splitting would break the build.
- Order: commit dependencies before dependents; keep related edits together.
- Never commit-only-imports, orphan formatting, or partial broken states alone.

## Messages

`<action> <what>` — lowercase start, imperative, specific (e.g. `fix cart total when discount is zero`).

## Steps

1. Analyze: `git status`, `git diff`.
2. Plan commit boundaries (grouping above).
3. For each commit: `git add … && git commit -m '…'` (no `--no-verify`). On hook failure, fix and retry.
4. Summarize: messages and count; confirm success.

If push is requested: `git push` with same permissions; fix failures and retry.

If you started `npm run dev` for a failing check, run `npm run kill` when finished.
