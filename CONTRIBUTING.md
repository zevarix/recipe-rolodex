# Adding a recipe

This is a curated family collection, but suggestions are welcome through GitHub issues or pull requests.

1. Save one Markdown file under `docs/recipes/<descriptive-slug>.md`. Keep the slug stable so links don't break. For a complete meal plan, put the file in `docs/dinners/<descriptive-slug>.md` instead.
2. Begin the file with YAML front matter (title, description, tags). Every recipe needs exactly one course tag and at least one ingredient or style tag. Reuse existing tag names and capitalization; future recipes appear automatically in the catalog.
3. Include a clear title, yield, prep/cook time, ingredients with units, sequential instructions, and a practical note about substitutions or food safety.
4. Keep the method tested or clearly labeled as a draft. Name purchased components rather than implying they are homemade.
5. Add one serving-size control panel (recipe-tools, with data-recipe-base-servings) and wrap scalable quantities in a recipe-amount span with data-base and data-unit. Use data-max for ranges, data-plural when needed, data-format=whole for metric gram or garlic values, and data-format=decimal1 for package-specific ounces. Include the matching decrease/increase buttons in the toolbar. The visible default must match the six-serving base recipe, because the Markdown remains usable without JavaScript. Never mark temperatures, cooking durations, or food-safety instructions as scalable.
6. Do **not** add every recipe to `mkdocs.yml` or the Browse page: Zensical tags build those indexes. Link related recipes and dinner plans where useful. Homepage feature cards are intentionally curated rather than exhaustive.
7. Validate with `python3 tools/validate_recipes.py` and `zensical build --clean`, plus `node --test tests/recipe-tools.test.cjs`.

## Filing labels

Choose **exactly one course** for each recipe:

- Mains
- Sides
- Breakfast
- Soups
- Salads
- Desserts
- Baking
- Snacks
- Sauces
- Drinks

Add one or more descriptive tags for ingredients, technique, or style. Examples currently in use: Seafood, Pasta, Pesto, Garlic, Bread. Reuse a tag rather than inventing nearly identical spellings. New descriptive tags do not require a configuration change.

Example recipe front matter:

~~~yaml
---
title: Example Pasta Dish
description: A short, useful description of what makes the dish good.
tags:
  - Mains
  - Pasta
  - Garlic
---
~~~

Dinner plans use the same front matter pattern but tag them with **Dinner Plans** instead of a course; they are automatically listed on the dinner plans page. The front matter must be followed by the normal Markdown heading and cooking instructions.

**Why tag-based filing?** Recipes may fit more than one search label, but each has a single primary course. Moving them into category folders would change URLs, so existing recipes stay at stable paths even when the collection grows.

**Public privacy:** Do not include personal addresses, identifiable family details, or unlicensed third-party imagery. Do not copy other authors' recipe text. Recipe inspiration or ingredient sources can be credited with links.

**Licensing contributions:** Original recipe writing and other creative prose contributed to this project must be publishable under [CC BY 4.0](LICENSE-CONTENT.md); original website code and technical implementation under [MIT](LICENSE-CODE.txt). By contributing, you confirm you hold the necessary rights and agree that your contribution may be published under its applicable license. You retain your own copyright; disclose any third-party material or separate attribution. Do not submit other creators' photos, text, software, or branding unless the project has confirmed compatible permission. See the [license scope map](LICENSE.md).
