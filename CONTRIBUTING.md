# Adding a recipe

This is a curated family collection, but suggestions are welcome through GitHub issues or pull requests.

1. Copy the structure of an existing recipe in `docs/recipes/`.
2. Include a clear title, yield, prep/cook time, ingredients with units, sequential instructions, and a practical note about substitutions or food safety.
3. Keep the method tested or clearly labeled as a draft. Name purchased components rather than implying they are homemade.
4. Add one serving-size control panel (recipe-tools, with data-recipe-base-servings) and wrap scalable quantities in a recipe-amount span with data-base and data-unit. Use data-max for ranges, data-plural when needed, and data-format=whole for metric gram values. The visible default must match the six-serving base recipe, because the Markdown remains usable without JavaScript. Never mark temperatures, cooking durations, or food-safety instructions as scalable.
5. Link it from `docs/recipes/index.md` and `mkdocs.yml`. Connect related dinner plans where useful.
6. Validate with `python3 tools/validate_recipes.py` and `zensical build --clean`, plus `node --test tests/recipe-tools.test.cjs`.

**Public privacy:** Do not include personal addresses, identifiable family details, or unlicensed third-party imagery. Do not copy other authors' recipe text. Recipe inspiration or ingredient sources can be credited with links.

**Licensing contributions:** Original recipe writing and other creative prose contributed to this project must be publishable under [CC BY 4.0](LICENSE-CONTENT.md); original website code and technical implementation under [MIT](LICENSE-CODE.txt). By contributing, you confirm you hold the necessary rights and agree that your contribution may be published under its applicable license. You retain your own copyright; disclose any third-party material or separate attribution. Do not submit other creators' photos, text, software, or branding unless the project has confirmed compatible permission. See the [license scope map](LICENSE.md).
