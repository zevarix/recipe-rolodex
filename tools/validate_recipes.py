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
FACET_PAGE_MAP = {
    "by-course.md": "Course",
    "by-meal.md": "Meal",
    "by-ingredient.md": "Ingredient",
    "by-style.md": "Style",
}
RECIPE_FILES = sorted(p for p in (DOCS / "recipes").rglob("*.md")
                      if p.name not in FACET_PAGE_MAP and p.name != "index.md")
DINNER_FILES = sorted(p for p in (DOCS / "dinners").rglob("*.md") if p.name != "index.md")
COURSE_TAGS = {
    "Mains", "Sides", "Soups", "Salads", "Desserts",
    "Snacks", "Breads", "Sauces", "Drinks",
}
MEAL_TAGS = {"Breakfast", "Brunch", "Lunch", "Dinner", "Anytime"}

LOCAL_LINKS = re.compile(r"\]\(([^)]+)\)|\bhref=[\"']([^\"']+)[\"']")
errors = []
TAG_SPELLINGS = {}


def check_filing_metadata(source, kind):
    """Validate the simple, stable front matter contract for auto-filed recipes."""
    path = source.relative_to(ROOT)
    lines = source.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0] != "---":
        errors.append(f"{path}: missing YAML front matter")
        return
    try:
        end = lines.index("---", 1)
    except ValueError:
        errors.append(f"{path}: missing front matter closing delimiter")
        return
    head = lines[1:end]
    for key in ("title", "description"):
        values = [line[len(key)+1:].strip() for line in head if line.startswith(key + ":")]
        if len(values) != 1 or not values[0]:
            errors.append(f"{path}: require one nonempty {key} value")
    if head.count("tags:") != 1:
        errors.append(f"{path}: require one YAML tags list")
        return
    tag_start = head.index("tags:")
    tags = []
    for line in head[tag_start+1:]:
        if line and not line[0].isspace():
            break
        if not line.strip():
            continue
        if not line.startswith("  - "):
            errors.append(f"{path}: use a two-space-indented YAML tag list")
            return
        tag = line[4:].strip().strip(chr(34)).strip(chr(39))
        if not tag or tag != tag.strip() or any(ord(c) < 32 for c in tag):
            errors.append(f"{path}: invalid tag label {tag!r}")
            return
        tags.append(tag)
    if not tags:
        errors.append(f"{path}: at least one tag required")
        return
    if len({t.casefold() for t in tags}) != len(tags):
        errors.append(f"{path}: duplicate case-insensitive tags")
    for tag in tags:
        key = tag.casefold()
        if key in TAG_SPELLINGS and TAG_SPELLINGS[key] != tag:
            errors.append(f"{path}: use established tag spelling {TAG_SPELLINGS[key]!r}, not {tag!r}")
        else:
            TAG_SPELLINGS[key] = tag
    if kind == "recipe":
        facets = {"Course", "Meal", "Ingredient", "Style"}
        parsed = []
        for tag in tags:
            pieces = tag.split("/")
            if len(pieces) != 2 or pieces[0] not in facets or not pieces[1]:
                errors.append(f"{path}: use a Course/, Meal/, Ingredient/ or Style/ tag: {tag!r}")
                continue
            parsed.append((pieces[0], pieces[1]))
        courses = [name for facet, name in parsed if facet == "Course"]
        if len(courses) != 1 or courses[0] not in COURSE_TAGS:
            errors.append(f"{path}: exactly one course tag required (choose from {sorted(COURSE_TAGS)})")
        if not any(facet in ("Ingredient", "Style") for facet, _ in parsed):
            errors.append(f"{path}: include an Ingredient/ or Style/ search tag")
        for facet, name in parsed:
            if facet == "Meal" and name not in MEAL_TAGS:
                errors.append(f"{path}: unknown meal tag {name!r} (choose from {sorted(MEAL_TAGS)})")
    else:
        if "Dinner Plans" not in tags:
            errors.append(f"{path}: dinner plan needs the Dinner Plans filing tag")
        if any(tag != "Dinner Plans" for tag in tags):
            errors.append(f"{path}: dinner plans only use their reserved Dinner Plans tag for now")


class QuantitySpans(HTMLParser):
    def __init__(self):
        super().__init__()
        self.quantities = []
        self.toolbars = []
        self.counter_buttons = []
        self.servings_inputs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get("class", "").split()
        if tag == "span" and "recipe-amount" in classes:
            self.quantities.append(attrs)
        if tag == "div" and "recipe-tools" in classes:
            self.toolbars.append(attrs)
        if tag == "button" and "recipe-stepper" in classes:
            self.counter_buttons.append(attrs)
        if tag == "input" and "recipe-servings-input" in classes:
            self.servings_inputs.append(attrs)

def check_scale_metadata(source):
    path = source.relative_to(ROOT)
    tags = QuantitySpans()
    tags.feed(source.read_text(encoding="utf-8"))
    if len(tags.toolbars) != 1:
        errors.append(f"{path}: expected exactly one serving-size toolbar")
    else:
        if len(tags.servings_inputs) != 1:
            errors.append(f"{path}: expected exactly one servings input")
        else:
            toolbar = tags.toolbars[0]
            field = tags.servings_inputs[0]
            try:
                baseline = int(toolbar.get("data-recipe-base-servings", ""))
                initial = int(field.get("value", ""))
                minimum = int(field.get("min", ""))
                maximum = int(field.get("max", ""))
                if not (1 <= minimum <= baseline == initial <= maximum <= 24):
                    raise ValueError("baseline and input disagree or exceed supported range")
                if field.get("type") != "number":
                    raise ValueError("servings input must use type=number")
            except ValueError:
                errors.append(f"{path}: invalid serving baseline or input range")
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
    check_filing_metadata(recipe, "recipe")
    content = recipe.read_text(encoding="utf-8")
    for heading in ("# ", "## Ingredients", "## Instructions"):
        if heading not in content:
            errors.append(f"{recipe.relative_to(ROOT)}: missing {heading!r}")
    if 'class="recipe-facts"' not in content:
        errors.append(f"{recipe.relative_to(ROOT)}: missing recipe-facts summary")

    check_scale_metadata(recipe)

for dinner in DINNER_FILES:
    check_filing_metadata(dinner, "dinner")
    check_scale_metadata(dinner)

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

config = (ROOT / "mkdocs.yml").read_text(encoding="utf-8")
if not re.search(r"(?m)^  - tags:\s*$", config) or "tags_hierarchy: true" not in config:
    errors.append("Zensical native tags plugin must be enabled")
for name, facet in FACET_PAGE_MAP.items():
    path = DOCS / "recipes" / name
    expected = "<!-- material/tags { scope: true, include: [" + facet + "] } -->"
    if not path.is_file() or expected not in path.read_text(encoding="utf-8"):
        errors.append(f"Missing native {facet} catalog in {path.relative_to(ROOT)}")
    elif '??? abstract "' not in path.read_text(encoding="utf-8"):
        errors.append(f"{path.relative_to(ROOT)}: category catalog must be collapsible")

if "<!-- material/tags" in (DOCS / "recipes/index.md").read_text(encoding="utf-8"):
    errors.append("Browse landing page must not contain the unbounded tag listing")
if not (DOCS / "dinners/index.md").is_file() or "<!-- material/tags" not in (DOCS / "dinners/index.md").read_text(encoding="utf-8"):
    errors.append("Missing native dinner-plan catalog")
if "draft_docs: |" not in config or "/drafts/" not in config or "*.draft.md" not in config:
    errors.append("Local preview-only draft patterns must be configured")
ignored = (ROOT / ".gitignore").read_text(encoding="utf-8")
if "docs/drafts/" not in ignored or "docs/**/*.draft.md" not in ignored:
    errors.append("Public repository must ignore local draft sources")
nav = config.split("nav:\n", 1)[-1].split("\ntheme:", 1)[0]
for expected in (
    "  - Recipes:",
    "      - Browse recipes:",
    "      - By course:",
    "      - By mealtime:",
    "      - By ingredient:",
    "      - By style:",
    "  - Dinner plans:",
):
    if expected not in nav:
        errors.append(f"Missing bounded navigation group {expected}")
if "javascripts/recipe-tools.js" not in config:
    errors.append("Zensical configuration must load the recipe tools JavaScript")
if not (DOCS / "javascripts/recipe-tools.js").is_file():
    errors.append("Missing recipe tools JavaScript")

if errors:
    print("FAIL recipe validation:")
    for error in errors:
        print(" -", error)
    sys.exit(1)
print(f"PASS: {len(RECIPE_FILES)} recipes, {len(DINNER_FILES)} dinner plans, "
      f"{len(list(DOCS.rglob('*.md')))} Markdown pages; filing tags, serving data, "
      "and local links checked")
