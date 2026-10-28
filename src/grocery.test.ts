import { describe, expect, it } from "vitest";
import { groupText, regroupText, ungroupText } from "./grocery";

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

describe("regroupText", () => {
  it("groups a flat selection", () => {
    expect(regroupText("- milk\n- apples")).toBe(
      "## Produce\n- apples\n\n## Dairy & Eggs\n- milk",
    );
  });

  it("re-groups an already-grouped selection without duplicate headings", () => {
    const input = "## Produce\n- apples\n\n## Dairy & Eggs\n- milk";
    expect(regroupText(input)).toBe(input);
  });
});
