# obsidian-household

Private Obsidian plugin with household tools for the Schiller family. Built
around plain Markdown notes synced via our separate `synch` plugin, and
installed with BRAT.

## Tools

- **Grocery sorting** — a `grocery-buttons` code block renders Group/Ungroup
  buttons that act on the current selection in any note, grouping items under
  department headings (or flattening back to a plain list). The group/ungroup
  commands work anywhere too. Categories are copied verbatim from
  schiller.town's grocery categorizer.
- **Star chart** — a `starchart` code block that tracks squares (20 = 20 min of
  TV) and "All Day Dry" days (20 = a big reward). State and config live inside
  the block itself.

See [docs/BRAT.md](docs/BRAT.md) for install and release instructions.

## Development

```bash
pnpm install
pnpm dev          # watch + rebuild main.js
pnpm typecheck
pnpm test         # vitest
pnpm build        # typecheck + minified production bundle
```
