const test = require("node:test");
const assert = require("node:assert/strict");
const { formatQuantity, scaledAmountText } = require("../docs/javascripts/recipe-tools.js");

test("kitchen fractions stay human-readable", () => {
  assert.equal(formatQuantity(2 * 4 / 6), "1⅓");
  assert.equal(formatQuantity(3 / 2), "1½");
  assert.equal(formatQuantity(1 / 6), "⅙");
  assert.equal(formatQuantity(0.75), "¾");
  assert.equal(formatQuantity(500 * 4 / 6, "whole"), "333");
  assert.equal(formatQuantity(17.6 * 4 / 6), "11¾");
});
test("single amounts scale with units and inflections", () => {
  assert.equal(scaledAmountText({base: "2", unit: "lb"}, 4 / 6), "1⅓ lb");
  assert.equal(scaledAmountText({base: "1", unit: "loaf", plural: "loaves"}, 3 / 6), "½ loaf");
  assert.equal(scaledAmountText({base: "3", unit: "cup"}, 4 / 6), "2 cups");
  assert.equal(scaledAmountText({base: "4", unit: "clove", plural: "cloves"}, 6 / 4), "6 cloves");
  assert.equal(scaledAmountText({base: "500", unit: "g", format: "whole"}, 1 / 3), "167 g");
});
test("range amounts scale without collapsing meaningful endpoints", () => {
  assert.equal(scaledAmountText({base:"0.75",max:"1",unit:"cup"}, 4 / 6), "½–⅔ cup");
  assert.equal(scaledAmountText({base:"3",max:"4",unit:"clove",plural:"cloves"}, 1 / 6), "½–⅔ clove");
  assert.equal(scaledAmountText({base:"1",max:"2",unit:"tsp"}, 1), "1–2 tsp");
});
test("rejects malformed or unsafe quantities", () => {
  assert.throws(() => formatQuantity(-1), RangeError);
  assert.throws(() => scaledAmountText({base:"4",max:"3",unit:"cup"}, 1), RangeError);
  assert.throws(() => scaledAmountText({base:"Infinity",unit:"lb"}, 1), RangeError);
  assert.throws(() => scaledAmountText({base:"1",unit:"cup"}, 0), RangeError);
});

test("serving controls update visible ingredients and print only on user click", () => {
  const { initRecipeTools } = require("../docs/javascripts/recipe-tools.js");
  const events = {};
  const quantities = [
    { dataset: { base: "2", unit: "lb" }, textContent: "2 lb" },
    { dataset: { base: "3", max: "4", unit: "clove", plural: "cloves" }, textContent: "3–4 cloves" }
  ];
  const summary = { textContent: "Ingredient amounts for 6 servings" };
  const input = { value: "6", addEventListener(name, callback) { events[name] = callback; } };
  const printButton = { hidden: false, addEventListener(name, callback) { events[name] = callback; } };
  const article = { querySelectorAll() { return quantities; } };
  const toolbar = {
    dataset: { recipeBaseServings: "6" }, hidden: true,
    closest() { return article; },
    querySelector(selector) {
      return ({
        ".recipe-servings-input": input,
        ".recipe-serving-summary": summary,
        ".recipe-print-button": printButton
      })[selector];
    }
  };
  let printCalls = 0;
  global.document = { querySelectorAll() { return [toolbar]; } };
  global.window = { print() { printCalls++; } };
  try {
    initRecipeTools();
    assert.equal(toolbar.hidden, false);
    assert.equal(printCalls, 0);
    input.value = "4";
    events.input();
    assert.equal(quantities[0].textContent, "1⅓ lb");
    assert.equal(quantities[1].textContent, "2–2⅔ cloves");
    assert.match(summary.textContent, /4 servings/);
    events.click();
    assert.equal(printCalls, 1);
    input.value = "6";
    events.input();
    assert.equal(quantities[0].textContent, "2 lb");
    assert.equal(quantities[1].textContent, "3–4 cloves");
    input.value = "0";
    events.change();
    assert.equal(input.value, "1");
    assert.match(summary.textContent, /1 serving/);
    input.value = "";
    events.change();
    assert.equal(input.value, "6");
  } finally {
    delete global.document;
    delete global.window;
  }
});
