# AGENTS.md — obsidian-household

Private Obsidian plugin with household tools for the Schiller family. One plugin,
installed via BRAT, used only by Brian, Morgan, and CJ. It is deliberately
household-specific — do not add generality for its own sake.

## Architecture decisions (non-negotiable)

- **Plain Markdown is the established source of truth.** The grocery list and
  star chart read/write `.md` notes. Other file types and Obsidian Bases are
  both viable too (Bases is a core plugin, and synch syncs non-markdown files
  fine) — don't reject them out of hand for a future tool. But prefer markdown unless we have a good reason
- **File-name/block scoping, not configuration.** Grocery commands only act when
  the active note is named `Groceries.md`. The star chart renders only inside a
  \`\`\`starchart code block — no filename matching, no settings tab. Behavior is
  tied to the file/block, which keeps scope tight.
- **Star-chart state lives inside the code block** (not YAML frontmatter).
  `name` is config; the counters are state. The block is both the durable record
  and the thing the buttons rewrite in place. See the block format below.
- **Keyword-only categorization, no AI.** The category DB is ported verbatim
  from `schiller.town/party/grocery-categorizer.ts`. There is no Claude/API
  integration — the plugin is offline and free.
- **Hardcoded constants, no settings UI.** Thresholds change rarely; a settings
  tab is scope we don't need. Named constants live in `src/star-chart.ts`:
  `SQUARES_PER_TV = 20`, `DRY_DAYS_PER_REWARD = 20`,
  `TIMEZONE = "America/Los_Angeles"`.
- **Single hardcoded chart** ("Everett's Potty Chart"). No multi-kid support
  yet — if another kid needs one later, generalize _then_, not now.

## Stack & commands

Flat single-package repo (not a monorepo). TypeScript + esbuild, vitest,
colocated `src/*.test.ts`.

```bash
pnpm dev        # watch + rebuild main.js
pnpm typecheck  # tsc -noEmit -skipLibCheck
pnpm test       # vitest run
pnpm build      # typecheck + minified production bundle (main.js)
```

`main.js` is build output and gitignored. `obsidian` and the
codemirror/lezer packages are `external` in `esbuild.config.mjs`.

## Code layout

```
src/main.ts            # plugin entry: commands, ribbon icon, code-block processor
src/categories.ts      # keyword DB (DEPARTMENTS) + categorizeItem()
src/departments.ts     # DEPARTMENT_ORDER (13 names)
src/grocery.ts         # groupText / ungroupText / isGrouped (pure, tested)
src/star-chart.ts      # ChartState + pure reward/aging math (pure, tested)
src/starchart-block.ts # StarchartWidget (MarkdownRenderChild) + DOM/buttons
```

Keep pure logic in the `.ts` modules (unit-testable); keep the Obsidian API and
DOM in `main.ts` and `starchart-block.ts`. `categorizeItem` matches keywords
with word boundaries and longest-match-wins. The 13 categories, in canonical
output order: Produce · Meat, Seafood & Deli · Dairy & Eggs · Bakery · Pantry ·
Stuff · Frozen Foods · Trader Joe's · Costco · New Seasons · Fish Market ·
Winco · Other.

## Releasing

```bash
node scripts/bump-version.mjs patch   # or minor / major
git add -A && git commit -m "chore: bump to X.Y.Z"
git tag X.Y.Z && git push --tags
```

`bump-version.mjs` updates `manifest.json`, `versions.json`, and `package.json`
in lockstep. Pushing a tag triggers `.github/workflows/release.yml`, which runs
`pnpm test` + `pnpm build` and creates a GitHub release with `main.js`,
`manifest.json`, `styles.css`. BRAT picks up new releases on app restart.

Full install/release docs for humans are in `docs/BRAT.md`.

## Deferred

Allowance tracker and any other household tools were intentionally deferred.
The established pattern for a new tool: a Markdown file (or code block) as the
source of truth + a new pure-logic module + a command or code-block renderer.
Follow the star-chart shape unless a new tool has a reason to differ (e.g. a
native `data.json` or Bases store).
