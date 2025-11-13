# Contributing to BuildFlow

Thank you for contributing! To keep the project stable and reviewable, follow these rules:

1. Branches and commits
   - Always create a branch for your work; do not commit directly to `main`.
   - Use descriptive branch names like `feature/add-x` or `fix/issue-123`.

2. Pull Requests
   - Open a Pull Request from your branch into `main`.
   - Use the PR template (.github/PULL_REQUEST_TEMPLATE.md). Describe the change and how to test it.
   - A Code Owner review is required (see .github/CODEOWNERS) — @Vamsi-o is requested by default.
   - The `ci` status check is not required yet; CI will be added later.

3. Reviews and merging
   - A code owner (or an assigned reviewer) should approve the PR before merging.
   - Once approved, a maintainer can merge the PR into `main`.

4. Issues
   - Open an issue before implementing non-trivial changes to discuss design and scope.

If you'd like stricter automation (e.g., required status checks, automatic merges after approval), we can add CI and automation in a follow-up PR.
