# Recipe Rolodex

**Real dinners, worth repeating.**

A public, searchable family recipe collection built from Markdown using [Zensical](https://zensical.org/). The first meal is garlic-butter shrimp pesto spaghetti with Grandpa's Parmesan garlic bread and a small clam chowder starter.

**Website:** https://zevarix.github.io/recipe-rolodex/

## Read and contribute

- [Browse recipes](docs/recipes/index.md)
- [Dinner plan collection](docs/dinners/index.md)
- [Contributing recipes](CONTRIBUTING.md)
- [License and attribution guide](docs/licensing.md)

Recipes are readable directly in GitHub without building anything. The public website adds search, navigation, responsive recipe cards, and a printer-friendly view.

### A filing cabinet that stays small

The mobile menu contains expandable **Recipes** and **Dinner plans** groups, not hundreds of individual recipe titles. The [Browse recipes](docs/recipes/index.md) landing page links to four focused catalogs: [course](docs/recipes/by-course.md), [mealtime](docs/recipes/by-meal.md), [ingredient](docs/recipes/by-ingredient.md), and [style](docs/recipes/by-style.md). Zensical generates the listings from native tags. The catalogs are collapsible and mapped tags have native Lucide icons. Unmapped future tags get the default icon.

### Drafts (preview only)

Zensical previews drafts stored in the local docs/drafts folder or files named *.draft.md while using zensical serve. Production zensical build excludes them from pages, search, and listings. These paths are gitignored by default because this is a **public GitHub repository**. A draft committed to GitHub would still be publicly visible in source even if excluded from the website. Never force-add private or unapproved material; move a reviewed recipe to a normal docs/recipes/<slug>.md filename before publication.


**Filing system:** Every Markdown recipe has native hierarchical tags, such as `Course/Mains`, `Meal/Dinner`, `Ingredient/Seafood`, and `Style/Pesto`. Zensical automatically groups Course, Meal, Ingredient, and Style tags in the [recipe filing cabinet](docs/recipes/index.md). Zensical's native tags plugin automatically generates the [recipe filing cabinet](docs/recipes/index.md); dinner plans use their own [generated index](docs/dinners/index.md). There is no database or hand-maintained per-recipe navigation. Existing URLs stay stable as the collection grows. See [Contributing](CONTRIBUTING.md) for the taxonomy and copyable front matter.

Individual recipes and dinner plans offer touch-friendly decrease/increase serving controls (1–24), optional number entry, and a Print recipe link that opens the browser's native print dialog. The site needs no database, service, or tracking to calculate or print; without JavaScript, original Markdown quantities stay visible. Scaling gives practical kitchen estimates, not changes to food-safety temperatures or cook times.

## Local preview

Use Python 3.11+, Node.js 20+ (for local JavaScript tests), and a virtual environment, then:

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python3 tools/validate_recipes.py
node --test tests/recipe-tools.test.cjs
zensical serve
```

Build for publication with `zensical build --clean`. Generated `site/` is ignored.

## Publishing and CI relevance

`.github/workflows/pages.yml` builds and publishes to GitHub Pages **only** on `main` changes to `docs/**`, `mkdocs.yml`, `requirements.txt`, `tools/validate_recipes.py` or the publication workflow, plus manual dispatch. Unrelated root metadata changes do not consume a Pages build. A single job validates content, tests the dependency-free recipe JavaScript, builds once, and deploys only if those checks succeed. No background schedule, extra test matrix, or third-party publication service. Initial validation is local before publishing. When this workflow changes, review relevance, skipped/failed behavior, and runner time before merging.

## Privacy and licensing

This is **public**. Never include addresses, locations of relatives, family contact details, private photos, private GitHub assets, or personally identifying stories without consent. Food photos may be added after reviewing their rights and content.

**Copyright © 2026 Zevarix / Recipe Rolodex.** Original recipes, dinner plans, creative site writing, and documentation are licensed [CC BY 4.0](LICENSE-CONTENT.md): sharing and adaptations, including commercial reuse, require appropriate credit, a license link, and an indication of changes. Original website software and technical configuration are licensed separately under [MIT](LICENSE-CODE.txt). See the [scope map](LICENSE.md) and [public attribution guide](docs/licensing.md). Third-party materials, trademarks, and material marked with other rights are excluded from these grants.
