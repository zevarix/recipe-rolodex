/* Recipe Rolodex: dependency-free serving scale and native browser print. */
(() => {
  "use strict";

  const fractions = [
    [0, ""], [1 / 8, "⅛"], [1 / 6, "⅙"], [1 / 4, "¼"],
    [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"],
    [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"],
    [5 / 6, "⅚"], [7 / 8, "⅞"], [1, ""]
  ];
  const uninflectedUnits = new Set(["tbsp", "tsp", "oz", "lb", "g"]);

  function formatQuantity(amount, format = "fraction") {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new RangeError("Quantity must be a finite, nonnegative number");
    }
    if (format === "whole") {
      return String(Math.round(amount));
    }
    const whole = Math.floor(amount);
    const remainder = amount - whole;
    let nearest = fractions[0];
    for (const candidate of fractions) {
      if (Math.abs(candidate[0] - remainder) < Math.abs(nearest[0] - remainder)) {
        nearest = candidate;
      }
    }
    const integer = whole + (nearest[0] === 1 ? 1 : 0);
    return (integer ? String(integer) : "") + nearest[1] || "0";
  }

  function scaledAmountText({ base, max, unit, plural, format }, ratio) {
    const lower = Number(base) * ratio;
    const upper = max == null ? lower : Number(max) * ratio;
    if (!Number.isFinite(lower) || !Number.isFinite(upper) ||
        !Number.isFinite(ratio) || ratio <= 0 ||
        lower <= 0 || upper < lower || !unit) {
      throw new RangeError("Invalid recipe amount metadata");
    }
    const lowText = formatQuantity(lower, format);
    const highText = formatQuantity(upper, format);
    const range = lowText === highText ? lowText : lowText + "–" + highText;
    const finalUnit = uninflectedUnits.has(unit) || upper <= 1.000001
      ? unit
      : (plural || unit + "s");
    return range + " " + finalUnit;
  }

  function initRecipeTools() {
    document.querySelectorAll(".recipe-tools[data-recipe-base-servings]").forEach((toolbar) => {
      const baseline = Number(toolbar.dataset.recipeBaseServings);
      const input = toolbar.querySelector(".recipe-servings-input");
      const summary = toolbar.querySelector(".recipe-serving-summary");
      const printButton = toolbar.querySelector(".recipe-print-button");
      const article = toolbar.closest("article") || document;
      const quantities = Array.from(article.querySelectorAll(".recipe-amount[data-base]"));
      if (!Number.isInteger(baseline) || baseline < 1 ||
          !input || !summary || !printButton || !quantities.length) {
        return; // Without valid metadata, keep original Markdown content visible.
      }

      const originals = quantities.map((node) => node.textContent);
      const render = (count) => {
        const ratio = count / baseline;
        const changes = quantities.map((node, index) =>
          count === baseline ? originals[index] : scaledAmountText(node.dataset, ratio)
        );
        quantities.forEach((node, index) => { node.textContent = changes[index]; });
        summary.textContent = "Ingredient amounts for " + count +
          (count === 1 ? " serving" : " servings") +
          " (original batch: " + baseline + "). Timing and seasoning may need adjustment.";
      };
      const onInput = () => {
        const count = Number(input.value);
        if (Number.isInteger(count) && count >= 1 && count <= 24) {
          try { render(count); } catch (error) { console.warn("Unable to scale recipe", error); }
        }
      };
      const onChange = () => {
        const count = Number(input.value);
        input.value = String(Number.isFinite(count) && input.value !== ""
          ? Math.max(1, Math.min(24, Math.round(count))) : baseline);
        onInput();
      };

      try { render(baseline); } catch (error) {
        console.warn("Recipe quantities are incomplete", error);
        return;
      }
      input.addEventListener("input", onInput);
      input.addEventListener("change", onChange);
      if (typeof window.print === "function") {
        printButton.addEventListener("click", () => window.print());
      } else {
        printButton.hidden = true;
      }
      toolbar.hidden = false;
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { formatQuantity, scaledAmountText, initRecipeTools };
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initRecipeTools, { once: true });
    } else {
      initRecipeTools();
    }
  }
})();
