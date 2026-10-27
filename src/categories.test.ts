import { describe, expect, it } from "vitest";
import { categorizeItem } from "./categories";

describe("categorizeItem", () => {
  it.each([
    ["salmon", "Fish Market"],
    ["canned salmon", "Pantry"],
    ["toilet paper", "Costco"],
    ["chicken sausage", "New Seasons"],
    ["scallops", "Fish Market"],
    ["pesto", "Costco"],
    ["chai concentrate", "Trader Joe's"],
    ["apples", "Produce"],
    ["milk", "Dairy & Eggs"],
    ["bread", "Bakery"],
    ["ice cream", "Frozen Foods"],
    ["pasta", "Pantry"],
    ["shampoo", "Stuff"],
    ["some weird unknown item xyz123", "Other"],
    ["nuggies", "Frozen Foods"],
    ["Veggie dogs", "Meat, Seafood & Deli"],
  ])("maps %s to %s", (item, expected) => {
    expect(categorizeItem(item)).toBe(expected);
  });
});
