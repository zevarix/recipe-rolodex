const test = require("node:test");
const assert = require("node:assert/strict");
const { formatQuantity, scaledAmountText, clampServing, initRecipeTools } =
  require("../docs/javascripts/recipe-tools.js");

test("kitchen fractions and large quantities", () => {
  assert.equal(formatQuantity(2 * 4 / 6), "1⅓");
  assert.equal(formatQuantity(3 / 2), "1½");
  assert.equal(formatQuantity(1 / 6), "⅙");
  assert.equal(formatQuantity(0.75), "¾");
  assert.equal(formatQuantity(500 * 4 / 6, "whole"), "333");
  assert.equal(formatQuantity(17.6 * 4 / 6, "decimal1"), "11.7");
  assert.equal(formatQuantity(70.4, "decimal1"), "70.4");
});

test("single quantities scale using practical units", () => {
  assert.equal(scaledAmountText({ base: "2", unit: "lb" }, 4 / 6), "1⅓ lb");
  assert.equal(scaledAmountText({ base: "1", unit: "package" }, 4), "4 packages");
  assert.equal(scaledAmountText({ base: "17.6", unit: "oz", format: "decimal1" }, 4), "70.4 oz");
  assert.equal(scaledAmountText({ base: "500", unit: "g", format: "whole" }, 4), "2 kg");
  assert.equal(scaledAmountText({ base: "500", unit: "g", format: "whole" }, 4 / 6), "333 g");
  assert.equal(scaledAmountText({ base: "1", unit: "loaf", plural: "loaves" }, 3 / 6), "½ loaf");
  assert.equal(scaledAmountText({ base: "3", unit: "cup" }, 4 / 6), "2 cups");
  assert.equal(scaledAmountText({ base: "4", unit: "clove", plural: "cloves", format: "whole" }, 4 / 6), "3 cloves");
});

test("ranges scale and whole garlic cloves round cleanly", () => {
  assert.equal(scaledAmountText({ base:"0.75", max:"1", unit:"cup" }, 4 / 6), "½–⅔ cup");
  assert.equal(scaledAmountText({ base:"3", max:"4", unit:"clove", plural:"cloves", format:"whole" }, 4 / 6), "2–3 cloves");
  assert.equal(scaledAmountText({ base:"3", max:"4", unit:"clove", plural:"cloves", format:"whole" }, 1 / 6), "1 clove");
  assert.equal(scaledAmountText({ base:"1", max:"2", unit:"tsp" }, 1), "1–2 tsp");
});

test("reject malformed amounts and clamp serving counts", () => {
  assert.throws(() => formatQuantity(-1), RangeError);
  assert.throws(() => scaledAmountText({ base:"4", max:"3", unit:"cup" }, 1), RangeError);
  assert.throws(() => scaledAmountText({ base:"Infinity", unit:"lb" }, 1), RangeError);
  assert.throws(() => scaledAmountText({ base:"1", unit:"cup" }, 0), RangeError);
  assert.equal(clampServing(1000, 1, 24), 24);
  assert.equal(clampServing(0, 1, 24), 1);
  assert.equal(clampServing(9.8, 1, 24), 10);
});

function mockRecipeDOM() {
  const events = { input:{}, minus:{}, plus:{}, print:{} };
  function control(name) {
    return {
      disabled: false, hidden: false,
      addEventListener(event, callback) { events[name][event] = callback; }
    };
  }
  const input = { ...control("input"), value:"6", min:"1", max:"24" };
  const minus = control("minus");
  const plus = control("plus");
  const print = control("print");
  const summary = { textContent:"Ingredients for 6 servings" };
  const quantities = [
    { dataset:{ base:"2", unit:"lb" }, textContent:"2 lb" },
    { dataset:{ base:"1", unit:"package" }, textContent:"1 package" },
    { dataset:{ base:"17.6", unit:"oz", format:"decimal1" }, textContent:"17.6 oz" },
    { dataset:{ base:"500", unit:"g", format:"whole" }, textContent:"500 g" },
    { dataset:{ base:"3", max:"4", unit:"clove", plural:"cloves", format:"whole" }, textContent:"3–4 cloves" }
  ];
  const article = { querySelectorAll() { return quantities; } };
  const toolbar = {
    hidden:true, dataset:{ recipeBaseServings:"6" },
    closest() { return article; },
    querySelector(selector) {
      return ({
        ".recipe-servings-input":input,
        ".recipe-serving-summary":summary,
        ".recipe-print-button":print,
        ".recipe-stepper-minus":minus,
        ".recipe-stepper-plus":plus
      })[selector];
    }
  };
  return { events, input, minus, plus, print, summary, quantities, toolbar,
    document:{ querySelectorAll() { return [toolbar]; } } };
}

test("mobile stepper, 1000 stress input, and native printing stay synchronized", () => {
  const dom = mockRecipeDOM();
  let printCalls = 0;
  global.document = dom.document;
  global.window = { print() { printCalls++; } };
  try {
    initRecipeTools();
    assert.equal(dom.toolbar.hidden, false);
    assert.equal(printCalls, 0);
    assert.equal(dom.input.value, "6");
    dom.events.plus.click();
    assert.equal(dom.input.value, "7");
    dom.events.minus.click();
    assert.equal(dom.input.value, "6");

    dom.input.value = "4";
    dom.events.input.input();
    assert.equal(dom.quantities[0].textContent, "1⅓ lb");
    assert.equal(dom.quantities[4].textContent, "2–3 cloves");
    assert.match(dom.summary.textContent, /4 servings/);

    dom.input.value = "10";
    dom.events.input.input();
    assert.equal(dom.input.value, "10");
    assert.match(dom.summary.textContent, /10 servings/);

    dom.input.value = "1000";
    dom.events.input.input();
    assert.equal(dom.input.value, "24"); // No misleading 1000 while showing 10.
    assert.match(dom.summary.textContent, /Maximum 24 servings/);
    assert.equal(dom.quantities[0].textContent, "8 lb");
    assert.equal(dom.quantities[1].textContent, "4 packages");
    assert.equal(dom.quantities[2].textContent, "70.4 oz");
    assert.equal(dom.quantities[3].textContent, "2 kg");
    assert.equal(dom.plus.disabled, true);
    assert.equal(dom.minus.disabled, false);

    dom.events.print.click();
    assert.equal(printCalls, 1);
    assert.equal(dom.input.value, "24");

    dom.input.value = "";
    dom.events.input.input();
    assert.match(dom.summary.textContent, /Showing 24 servings/);
    dom.events.input.change();
    assert.equal(dom.input.value, "24");
    assert.match(dom.summary.textContent, /24 servings/);

    dom.input.value = "0";
    dom.events.input.input();
    assert.equal(dom.input.value, "1");
    assert.equal(dom.minus.disabled, true);
    dom.events.minus.click();
    assert.equal(dom.input.value, "1");

    dom.input.value = "6";
    dom.events.input.input();
    assert.equal(dom.quantities[1].textContent, "1 package");
    assert.equal(dom.quantities[2].textContent, "17.6 oz");
    assert.equal(dom.quantities[4].textContent, "3–4 cloves");
    assert.equal(printCalls, 1); // No implicit printing while adjusting.
  } finally {
    delete global.document;
    delete global.window;
  }
});
