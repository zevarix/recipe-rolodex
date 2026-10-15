/* Recipe Rolodex: progressive, dependency-free serving adjustments and printing. */
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
    if (format === "decimal1") {
      return amount.toFixed(1).replace(/\.0$/, "");
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

    // Large dry pasta batches read better as "2 kg" than "2000 g".
    if (unit === "g" && lower >= 1000) {
      const lowText = formatQuantity(lower / 1000);
      const highText = formatQuantity(upper / 1000);
      return (lowText === highText ? lowText : lowText + "–" + highText) + " kg";
    }
    const lowText = formatQuantity(lower, format);
    const highText = formatQuantity(upper, format);
    const range = lowText === highText ? lowText : lowText + "–" + highText;
    const finalUnit = uninflectedUnits.has(unit) || upper <= 1.000001
      ? unit
      : (plural || unit + "s");
    return range + " " + finalUnit;
  }

  function clampServing(value, min, max) {
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  function initRecipeTools() {
    document.querySelectorAll(".recipe-tools[data-recipe-base-servings]").forEach((toolbar) => {
      const baseline = Number(toolbar.dataset.recipeBaseServings);
      const input = toolbar.querySelector(".recipe-servings-input");
      const summary = toolbar.querySelector(".recipe-serving-summary");
      const printButton = toolbar.querySelector(".recipe-print-button");
      const minus = toolbar.querySelector(".recipe-stepper-minus");
      const plus = toolbar.querySelector(".recipe-stepper-plus");
      const article = toolbar.closest("article") || document;
      const quantities = Array.from(article.querySelectorAll(".recipe-amount[data-base]"));

      if (!Number.isInteger(baseline) || baseline < 1 || !input || !summary ||
          !printButton || !minus || !plus || !quantities.length) {
        return; // The original Markdown remains readable if metadata is incomplete.
      }

      const min = Number(input.min);
      const max = Number(input.max);
      if (!Number.isInteger(min) || !Number.isInteger(max) ||
          min < 1 || max < min || baseline > max || baseline < min) {
        return;
      }

      const originals = quantities.map((node) => node.textContent);
      let current = baseline;

      const render = (count) => {
        const ratio = count / baseline;
        const changes = quantities.map((node, index) =>
          count === baseline ? originals[index] : scaledAmountText(node.dataset, ratio)
        );
        // Commit together, never leave part of a recipe changed on an error.
        quantities.forEach((node, index) => { node.textContent = changes[index]; });
        current = count;
        input.value = String(count);
        minus.disabled = count <= min;
        plus.disabled = count >= max;
        summary.textContent = "Ingredients for " + count +
          (count === 1 ? " serving" : " servings") +
          " · original batch: " + baseline + ". Adjust timing and seasoning as needed.";
      };

      const setCount = (value) => {
        try { render(clampServing(value, min, max)); }
        catch (error) { console.warn("Unable to scale recipe", error); }
      };
      const onInput = () => {
        if (input.value === "") {
          summary.textContent = "Showing " + current + " servings · enter " +
            min + "–" + max + " or tap − / +.";
          return;
        }
        const entered = Number(input.value);
        if (!Number.isFinite(entered)) {
          input.value = String(current);
          return;
        }
        // Normalize immediately. No "1000" on screen while 10 servings are shown.
        setCount(entered);
        if (entered > max) {
          summary.textContent = "Maximum " + max +
            " servings · ingredients shown for " + max + ".";
        } else if (entered < min) {
          summary.textContent = "Minimum " + min +
            " serving · ingredients shown for " + min + ".";
        }
      };

      try { render(baseline); } catch (error) {
        console.warn("Recipe quantities are incomplete", error);
        return;
      }
      input.addEventListener("input", onInput);
      input.addEventListener("change", () => {
        if (input.value === "") {
          render(current);
        } else {
          onInput();
        }
      });
      minus.addEventListener("click", () => setCount(current - 1));
      plus.addEventListener("click", () => setCount(current + 1));
      if (typeof window.print === "function") {
        printButton.addEventListener("click", () => {
          render(current); // Ensure the printed serving count matches the ingredients.
          window.print();
        });
      } else {
        printButton.hidden = true;
      }
      toolbar.hidden = false;
    });
  }

  // Native category listings sit inside collapsible details. A tag link to
  // #tag:course/mains must reveal its hidden section on Safari and other browsers.
  function revealCatalogTag() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const hash = window.location && window.location.hash;
    if (!hash || !hash.startsWith("#tag:")) return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); }
    catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    const details = target.closest("details");
    if (!details) return;
    if (!details.open) {
      details.open = true;
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ block: "start" });
      }
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { formatQuantity, scaledAmountText, clampServing, initRecipeTools, revealCatalogTag };
  }
  if (typeof document !== "undefined") {
    const initialize = () => { initRecipeTools(); revealCatalogTag(); };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
      initialize();
    }
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("hashchange", revealCatalogTag);
    }
  }
})();
