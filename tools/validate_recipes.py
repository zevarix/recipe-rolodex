#!/usr/bin/env python3
"""Read-only, dependency-free structural checks for Recipe Rolodex."""
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys
import math
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
RECIPE_FILES = sorted((DOCS / "recipes").glob("*.md"))
LOCAL_LINKS = re.compile(r"\]\(([^)]+)\)|\bhref=[\"']([^\"']+)[\"']")
errors = []

class QuantitySpans(HTMLParser):
    def __init__(self):
        super().__init__()
        self.quantities = []
        self.toolbars = []
        self.counter_buttons = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get("class", "").split()
        if tag == "span" and "recipe-amount" in classes:
            self.quantities.append(attrs)
        if tag == "div" and "recipe-tools" in classes:
            self.toolbars.append(attrs)
        if tag == "button" and "recipe-stepper" in classes:
            self.counter_buttons.append(attrs)

def check_scale_metadata(source):
    path = source.relative_to(ROOT)
    tags = QuantitySpans()
    tags.feed(source.read_text(encoding="utf-8"))
    if len(tags.toolbars) != 1:
        errors.append(f"{path}: expected exactly one serving-size toolbar")
    elif tags.toolbars[0].get("data-recipe-base-servings") != "6":
        errors.append(f"{path}: serving baseline must match original six-serving quantities")
    if not tags.quantities:
        errors.append(f"{path}: no tagged scalable ingredient amounts")
    controls = [set(entry.get("class", "").split()) for entry in tags.counter_buttons]
    for expected in ("recipe-stepper-minus", "recipe-stepper-plus"):
        if sum(expected in classes for classes in controls) != 1:
            errors.append(f"{path}: expected one {expected} button")
    for index, tags_data in enumerate(tags.quantities, 1):
        try:
            base = float(tags_data.get("data-base", ""))
            upper = float(tags_data.get("data-max", str(base)))
            if not (math.isfinite(base) and base > 0):
                raise ValueError("base must be positive and finite")
            if not (math.isfinite(upper) and upper >= base):
                raise ValueError("maximum must be at least base")
            if not tags_data.get("data-unit"):
                raise ValueError("unit is required")
            if tags_data.get("data-format", "fraction") not in ("whole", "fraction", "decimal1"):
                raise ValueError("unrecognized format")
        except ValueError:
            errors.append(f"{path}: invalid amount metadata in span #{index}")

for recipe in RECIPE_FILES:
    if recipe.name == "index.md":
        continue
    content = recipe.read_text(encoding="utf-8")
    for heading in ("# ", "## Ingredients", "## Instructions"):
        if heading not in content:
            errors.append(f"{recipe.relative_to(ROOT)}: missing {heading!r}")
    if 'class="recipe-facts"' not in content:
        errors.append(f"{recipe.relative_to(ROOT)}: missing recipe-facts summary")

    check_scale_metadata(recipe)

check_scale_metadata(DOCS / "dinners/shrimp-pesto-supper.md")

for source in DOCS.rglob("*.md"):
    content = source.read_text(encoding="utf-8")
    for match in LOCAL_LINKS.finditer(content):
        url = (match.group(1) or match.group(2)).strip().split()[0]
        if not url or url.startswith("#") or url.startswith(("http://", "https://", "mailto:", "tel:")):
            continue
        parts = urlsplit(url)
        if parts.scheme or parts.netloc:
            continue
        path = unquote(parts.path)
        if not path or path.startswith("/"):
            continue
        candidate = (source.parent / path).resolve()
        if not candidate.is_relative_to(DOCS.resolve()):
            errors.append(f"{source.relative_to(ROOT)}: link escapes docs: {url}")
        elif path.endswith("/"):
            if not (candidate / "index.md").is_file() and not candidate.with_suffix(".md").is_file():
                errors.append(f"{source.relative_to(ROOT)}: missing target: {url}")
        elif not candidate.is_file():
            errors.append(f"{source.relative_to(ROOT)}: missing target: {url}")

for required in ("mkdocs.yml", "requirements.txt", "docs/stylesheets/recipes.css"):
    if not (ROOT / required).is_file():
        errors.append(f"Missing {required}")

if "javascripts/recipe-tools.js" not in (ROOT / "mkdocs.yml").read_text(encoding="utf-8"):
    errors.append("Zensical configuration must load the recipe tools JavaScript")
if not (DOCS / "javascripts/recipe-tools.js").is_file():
    errors.append("Missing recipe tools JavaScript")

if errors:
    print("FAIL recipe validation:")
    for error in errors:
        print(" -", error)
    sys.exit(1)
print(f"PASS: {len(RECIPE_FILES) - 1} recipes, {len(list(DOCS.rglob('*.md')))} Markdown pages, and local links checked")
