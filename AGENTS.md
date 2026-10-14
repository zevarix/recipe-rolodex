# Recipe Rolodex agent guidance

This repository owns its recipe content, its Zensical build, and its publication workflow. Current repository state and Peder's explicit Product directions outrank historical context or other repositories. Lyra and RCS do not inherit execution authority here.

- Preserve Peder's direction for a **public** recipe collection; do not publish unreviewed personal information, family/location identifiers, or other people's photos.
- Every recipe is original/adapted writing with ingredients, yield, method, and practical cooking notes. Attribute outside material where appropriate; do not copy protected recipe prose.
- Maintain working recipe-relative and website links. New recipes belong under `docs/recipes/`; menus and purchased-product serving plans belong under `docs/dinners/`.
- Validate with `python3 tools/validate_recipes.py` and `zensical build --clean` before integration or publication. Preserve accessible mobile and print layouts.
- Before changing CI, evaluate changed-file relevance, transitive inputs, duplicate jobs, skip/failure behavior, and runner cost. Do not add costly checks simply for ceremony.
- Do not modify another repository, account setting, license grant, billing, secret, or deployment target without separate authorization. Visibility is public by Peder's direction; licensing remains reserved.
- Favor focused branches and PRs after initial bootstrap. Never reset/clean/stash unfamiliar working trees. Confirm exact GitHub and Pages state after consequential mutations.
