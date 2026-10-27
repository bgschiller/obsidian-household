import { categorizeItem, DEPARTMENT_ORDER } from "./categories";

/**
 * Matches a markdown list item and splits off the list/checkbox prefix.
 * Group 1 = prefix (`- `, `- [ ] `, `- [x] `), group 2 = item text.
 */
const ITEM_RE = /^([-*]\s+(?:\[[ xX]\]\s+)?)(.*)$/;

type Item = { prefix: string; text: string; category: string };

/** Group a flat list of items into `## Department` headings (checkbox state preserved). */
export function groupText(text: string): string {
  const items: Item[] = [];
  const others: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (line.trim() === "") continue;

    const match = ITEM_RE.exec(line);
    if (match) {
      items.push({
        prefix: match[1],
        text: match[2].trim(),
        category: categorizeItem(match[2]),
      });
    } else {
      others.push(line);
    }
  }

  const byDept = new Map<string, string[]>();
  for (const item of items) {
    const bucket = byDept.get(item.category) ?? [];
    bucket.push(`${item.prefix}${item.text}`);
    byDept.set(item.category, bucket);
  }

  const out: string[] = [];
  for (const dept of DEPARTMENT_ORDER) {
    const lines = byDept.get(dept);
    if (!lines || lines.length === 0) continue;
    out.push(`## ${dept}`);
    out.push(...lines);
    out.push("");
  }

  if (others.length > 0) {
    out.push(...others);
  }

  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out.join("\n");
}

/** Strip `## Department` headings (and blank lines) to flatten back into a plain list. */
export function ungroupText(text: string): string {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (line.trim() === "") continue;
    if (/^#{1,6}\s+/.test(line.trim())) continue;
    out.push(line);
  }
  return out.join("\n");
}
