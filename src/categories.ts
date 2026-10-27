import { DEPARTMENTS } from "./departments";

/** Canonical order for grouped output, matching schiller.town's organizeByKeywords. */
export const DEPARTMENT_ORDER = [
  "Produce",
  "Meat, Seafood & Deli",
  "Dairy & Eggs",
  "Bakery",
  "Pantry",
  "Stuff",
  "Frozen Foods",
  "Trader Joe's",
  "Costco",
  "New Seasons",
  "Fish Market",
  "Winco",
  "Other",
];

/**
 * Categorize a single grocery item into a department using keyword matching.
 * Longer, more specific keyword matches win (e.g. "orange juice" over "orange").
 * Returns "Other" when nothing matches.
 */
export function categorizeItem(item: string): string {
  const normalizedItem = item.toLowerCase().trim();

  const matches: Array<{
    department: string;
    keyword: string;
    length: number;
  }> = [];

  for (const department of DEPARTMENTS) {
    for (const keyword of department.keywords) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, "i");
      if (regex.test(normalizedItem)) {
        matches.push({
          department: department.name,
          keyword,
          length: keyword.length,
        });
      }
    }
  }

  if (matches.length > 0) {
    matches.sort((a, b) => b.length - a.length);
    return matches[0].department;
  }

  return "Other";
}
