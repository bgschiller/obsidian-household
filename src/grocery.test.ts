import { describe, expect, it } from "vitest";
import { groupText, isGrouped, ungroupText } from "./grocery";

describe("groupText", () => {
  it("groups flat items under department headings", () => {
    const input = "- milk\n- apples";
    expect(groupText(input)).toBe("## Produce\n- apples\n\n## Dairy & Eggs\n- milk");
  });

  it("preserves checkbox state", () => {
    expect(groupText("- [ ] milk")).toBe("## Dairy & Eggs\n- [ ] milk");
  });
});

describe("ungroupText", () => {
  it("strips department headings and blank lines", () => {
    const input = "## Produce\n- apples\n\n## Dairy & Eggs\n- milk";
    expect(ungroupText(input)).toBe("- apples\n- milk");
  });
});

describe("isGrouped", () => {
  it("detects department headings", () => {
    expect(isGrouped("## Produce\n- apples")).toBe(true);
  });

  it("returns false for a flat list", () => {
    expect(isGrouped("- apples\n- milk")).toBe(false);
  });

  it("ignores non-department headings", () => {
    expect(isGrouped("# Groceries\n- apples")).toBe(false);
  });
});
