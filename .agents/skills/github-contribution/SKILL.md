---
name: github-contribution
description: Guides the end-to-end contribution workflow for a selected issue: setting up isolated sandboxes, inspecting repository guidelines, implementing fixes, running tests, and preparing pull requests behind strict approval gates.
---

# GitHub Contribution Skill

## Purpose
Manage the complete local lifecycle of an open-source contribution for Badri Vishal Pandey: workspace isolation, repository inspection, solution planning, code editing, local test verification, commit hygiene, and pull request preparation. Guarantees that no external write (git push, issue comment, PR submission) occurs without explicit user approval.

## Inputs
- `issue_candidate_id`: Identifier of the accepted issue from triage.
- `repo_url`: Git repository URL.
- `target_branch`: Upstream branch to branch from (typically `main` or `master`).
- `local_sandbox_path`: Designated local directory for the contribution worktree/clone.

## Operational Rules & Boundaries
1. **Isolated execution (Hard Rule)**: Never run third-party repository build scripts or commands with access to CareerOS application secrets, environment variables, or private data. Use isolated sandbox directories with resource/time limits.
2. **Inspect before execute (Hard Rule)**: Treat all repository scripts (`package.json`, `Makefile`, shell scripts) as untrusted data. Inspect commands before running them. Never run arbitrary remote curl/wget scripts.
3. **No unauthorized remote writes**: Never run `git push`, open an issue, post a comment, or create a pull request without an explicit, action-specific approval immediately before the action.
4. **Substantive and idiomatic code**: Adhere strictly to upstream repository coding style, linting rules, and architecture. Never write artificial filler comments, weird phrasing, or claim to evade AI detectors.
5. **Test before claim (Hard Rule)**: Every proposed PR must be backed by executed unit/integration tests with exact recorded commands and results. Never claim a test passed if it was skipped.

## Execution Steps
1. **Repository & Policy Inspection**:
   - Clone/fetch upstream repository into the isolated sandbox.
   - Read and analyze `CONTRIBUTING.md`, `LICENSE`, `CODE_OF_CONDUCT.md`, and developer documentation.
   - Identify branch naming conventions, commit message formatting (e.g., Conventional Commits), and required linters/formatters.
2. **Contribution Plan Formulation**:
   - Reproduce the reported issue or verify the expected feature behavior.
   - Outline a minimal, focused contribution plan: files to modify, changes to make, new tests to add.
   - Present plan to user for review before making code modifications.
3. **Local Implementation & Testing**:
   - Create a clean local feature branch (e.g., `fix/issue-123-description`).
   - Implement minimal changes strictly addressing the issue without unnecessary refactoring.
   - Add targeted automated tests verifying the fix and preventing regressions.
   - Run repository test suite and linters; log commands and exact outputs.
4. **Diff Review & Commit Staging**:
   - Generate full git diff and check for unintended modifications or stray files.
   - Format commit message according to repository conventions.
   - Draft pull request title, description, and link to issue (e.g., `Fixes #123`).
5. **Approval Packaging**:
   - Calculate SHA-256 hash of the final patch diff.
   - Present PR draft, full diff, and test run logs to the user for explicit approval.

## Outputs
- `ContributionTask`:
  - `id`: Unique contribution task ID.
  - `repo_name`: Target repository.
  - `branch_name`: Local working branch name.
  - `patch_diff`: Full unified diff of proposed changes.
  - `diff_hash`: Cryptographic hash of the patch.
  - `test_results`: Exact test execution commands, exit codes, and output snippets.
  - `pr_title`: Proposed pull request title.
  - `pr_body`: Proposed pull request description linking back to issue.
  - `status`: `IN_PROGRESS` | `TESTS_PASSED` | `APPROVED` | `PUSHED` | `PR_OPENED`.

## Approval Gates
- **Plan Approval Gate**: User reviews and approves the technical contribution plan before implementation begins.
- **Diff & Test Approval Gate**: User inspects the unified diff and test outputs before any push is permitted.
- **PR Submission Gate**: An explicit confirmation immediately preceding `git push` and GitHub PR creation API call. If the patch diff changes, prior approvals are invalidated.

## Failure Handling
- **Failing Tests**: If existing or new tests fail, halt progression and document the exact failure. Do not bypass or disable existing tests.
- **Untrusted Script Warning**: If the target repo requires running high-risk commands (e.g., root permissions, arbitrary pre-install scripts), alert the user and halt execution.
- **Upstream Merge Conflicts**: If the upstream branch moves ahead, guide the user through rebasing and re-running the test suite before requesting approval again.
