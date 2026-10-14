#!/usr/bin/env python3
"""Read-only, dependency-free structural checks for Recipe Rolodex."""
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
RECIPE_FILES = sorted((DOCS / "recipes").glob("*.md"))
LOCAL_LINKS = re.compile(r"\]\(([^)]+)\)|\bhref=[\"']([^\"']+)[\"']")
errors = []

for recipe in RECIPE_FILES:
    if recipe.name == "index.md":
        continue
    content = recipe.read_text(encoding="utf-8")
    for heading in ("# ", "## Ingredients", "## Instructions"):
        if heading not in content:
            errors.append(f"{recipe.relative_to(ROOT)}: missing {heading!r}")
    if 'class="recipe-facts"' not in content:
        errors.append(f"{recipe.relative_to(ROOT)}: missing recipe-facts summary")

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

if errors:
    print("FAIL recipe validation:")
    for error in errors:
        print(" -", error)
    sys.exit(1)
print(f"PASS: {len(RECIPE_FILES) - 1} recipes, {len(list(DOCS.rglob('*.md')))} Markdown pages, and local links checked")
