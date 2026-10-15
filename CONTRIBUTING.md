# Adding a recipe

This is a curated family collection, but suggestions are welcome through GitHub issues or pull requests.

1. Save one Markdown file under `docs/recipes/<descriptive-slug>.md`. Keep the slug stable so links don't break. For a complete meal plan, put the file in `docs/dinners/<descriptive-slug>.md` instead.
2. Begin the file with YAML front matter (title, description, tags). Every recipe needs exactly one course tag and at least one ingredient or style tag. Reuse existing tag names and capitalization; future recipes appear automatically in the catalog.
3. Include a clear title, yield, prep/cook time, ingredients with units, sequential instructions, and a practical note about substitutions or food safety.
4. Keep the method tested or clearly labeled as a draft. Name purchased components rather than implying they are homemade.
5. Add one serving-size control panel (recipe-tools, with data-recipe-base-servings) and wrap scalable quantities in a recipe-amount span with data-base and data-unit. Use data-max for ranges, data-plural when needed, data-format=whole for metric gram or garlic values, and data-format=decimal1 for package-specific ounces. Include the matching decrease/increase buttons in the toolbar. Choose a suitable original serving count for each new recipe (1–24), and set both the toolbar's data-recipe-base-servings and the number input's default value to that count. The visible default measurements must match that recipe's baseline, because Markdown remains usable without JavaScript. Never mark temperatures, cooking durations, or food-safety instructions as scalable.
6. Do **not** list each recipe in `mkdocs.yml` or the Browse page. Zensical builds the Course, Meal, Ingredient, and Style catalog pages automatically. Keep the mobile Recipes accordion bounded to those four browse facets and the featured index. Homepage feature cards are curated rather than exhaustive; link related recipes and dinner plans when useful.
7. Validate with `python3 tools/validate_recipes.py` and `zensical build --clean`, plus `node --test tests/recipe-tools.test.cjs`.

## Draft previews and category icons

While developing an unreviewed recipe, create a local file under docs/drafts/ or name it <slug>.draft.md. Use zensical serve to preview it before publication. Draft patterns are ignored by Git and excluded from production builds, search, and category listings.

**Public-source warning:** The draft feature does not hide a file that has been committed to the public GitHub repository. Never force-add private, unapproved, or third-party material. Publish by moving or renaming a reviewed recipe to docs/recipes/<slug>.md, completing its filing metadata, validating, and using the normal pull-request workflow.

Zensical maps common categories to built-in Lucide icons through the theme and extra tag configuration. Newly introduced tags work automatically with the default icon; add explicit icon mappings only when a new category's visual distinction is genuinely useful.

## Filing labels

Zensical uses **hierarchical tags**, which act like folders without changing Markdown file paths or public URLs. Choose exactly one primary course:

- `Course/Mains`
- `Course/Sides`
- `Course/Soups`
- `Course/Salads`
- `Course/Desserts`
- `Course/Snacks`
- `Course/Breads`
- `Course/Sauces`
- `Course/Drinks`

Add zero or more meal occasions:

- `Meal/Breakfast`
- `Meal/Brunch`
- `Meal/Lunch`
- `Meal/Dinner`
- `Meal/Anytime`

Add one or more searchable ingredient/style tags, such as `Ingredient/Seafood`, `Ingredient/Pasta`, `Ingredient/Garlic`, `Ingredient/Bread`, or `Style/Pesto`. New ingredients and styles automatically appear as sections of the filing cabinet. Reuse existing names/capitalization and avoid synonyms that create duplicate filing labels.

Example:

~~~yaml
---
title: Example Pasta Dish
description: A short, useful description of what makes the dish good.
tags:
  - Course/Mains
  - Meal/Dinner
  - Ingredient/Pasta
  - Ingredient/Garlic
---
~~~

Dinner plans instead use the reserved `Dinner Plans` tag, so they appear in the automatically generated dinner index rather than the recipe index. The front matter is followed by the normal Markdown heading and cooking instructions.

**Why hierarchical tags?** They group recipes by Course, Meal, Ingredient, and Style, while allowing the same recipe to be listed under several matching labels. There is one original Markdown file per recipe, and no category-folder moves that would break its URL.

**Public privacy:** Do not include personal addresses, identifiable family details, or unlicensed third-party imagery. Do not copy other authors' recipe text. Recipe inspiration or ingredient sources can be credited with links.

**Licensing contributions:** Original recipe writing and other creative prose contributed to this project must be publishable under [CC BY 4.0](LICENSE-CONTENT.md); original website code and technical implementation under [MIT](LICENSE-CODE.txt). By contributing, you confirm you hold the necessary rights and agree that your contribution may be published under its applicable license. You retain your own copyright; disclose any third-party material or separate attribution. Do not submit other creators' photos, text, software, or branding unless the project has confirmed compatible permission. See the [license scope map](LICENSE.md).
