# Recipe Rolodex

**Real dinners, worth repeating.**

A public, searchable family recipe collection built from Markdown using [Zensical](https://zensical.org/). The first meal is garlic-butter shrimp pesto spaghetti with Grandpa's Parmesan garlic bread and a small clam chowder starter.

**Website:** https://zevarix.github.io/recipe-rolodex/

## Read and contribute

- [Browse recipes](docs/recipes/index.md)
- [Shrimp pesto dinner plan](docs/dinners/shrimp-pesto-supper.md)
- [Contributing recipes](CONTRIBUTING.md)

Recipes are readable directly in GitHub without building anything. The public website adds search, navigation, responsive recipe cards, and a printer-friendly view.

## Local preview

Use Python 3.11+ and a virtual environment, then:

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python3 tools/validate_recipes.py
zensical serve
```

Build for publication with `zensical build --clean`. Generated `site/` is ignored.

## Publishing and CI relevance

`.github/workflows/pages.yml` builds and publishes to GitHub Pages **only** on `main` changes to `docs/**`, `mkdocs.yml`, `requirements.txt`, `tools/validate_recipes.py` or the publication workflow, plus manual dispatch. Unrelated root metadata changes do not consume a Pages build. A single job validates content, builds once, and deploys only if those checks succeed. No background schedule, extra test matrix, or third-party publication service. Initial validation is local before publishing. When this workflow changes, review relevance, skipped/failed behavior, and runner time before merging.

## Privacy and licensing

This is **public**. Never include addresses, locations of relatives, family contact details, private photos, private GitHub assets, or personally identifying stories without consent. Food photos may be added after reviewing their rights and content.

Copyright © 2026 Zevarix. **No reuse license has been selected yet.** Visibility on GitHub and the website does not independently grant permission to redistribute or modify the contents. A future MIT code / Creative Commons recipe licensing decision is reserved to the project owner.
