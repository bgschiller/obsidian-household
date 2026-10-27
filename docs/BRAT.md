# Installing with BRAT

This plugin is distributed via GitHub releases and installed with
[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tool).

## One-time setup

1. Install BRAT from the Obsidian community plugin browser.
2. Open Settings → BRAT → "Add Beta plugin".
3. Enter `https://github.com/bgschiller/obsidian-household`.
4. Enable the "Household" plugin under Settings → Community plugins.

## Releasing a new version

```bash
pnpm run build        # typecheck + bundle
pnpm test             # run unit tests
node scripts/bump-version.mjs patch   # or minor / major
git add -A && git commit -m "chore: bump to X.Y.Z"
git tag X.Y.Z && git push --tags
```

The GitHub Actions workflow builds `main.js`, `manifest.json`, and
`styles.css` and attaches them to the tag's release. BRAT checks for new
versions on each app start (or via "Check for updates" in BRAT settings).

## Note files

- **Groceries**: keep a note named `Groceries.md`. Select items and run the
  "Group selection by department" command (or the shopping-cart ribbon icon).
- **Star chart**: add a `starchart` code block to any note:

  ````markdown
  ```starchart
  ```
  ````

  Progress is stored in that note's frontmatter (`totalSquares`, `dryCount`,
  `exchanges`).
