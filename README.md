# obsidian-household

Private Obsidian plugin with household tools for the Schiller family. Built
around plain Markdown notes synced via our separate `synch` plugin, and
installed with BRAT.

## Tools

- **Grocery sorting** — select items in `Groceries.md` and group them under
  department headings (or flatten back to a plain list). Categories are copied
  verbatim from schiller.town's grocery categorizer.
- **Star chart** — a `starchart` code block that tracks squares (20 = 20 min of
  TV) and "All Day Dry" days (20 = a big reward). Progress lives in the note's
  frontmatter.

See [docs/BRAT.md](docs/BRAT.md) for install and release instructions.

## Development

```bash
pnpm install
pnpm dev          # watch + rebuild main.js
pnpm typecheck
pnpm test         # vitest
pnpm build        # typecheck + minified production bundle
```
