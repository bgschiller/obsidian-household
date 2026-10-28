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

- **Groceries**: add a `grocery-buttons` code block to any note (or use the
  "Group selection by department" / "Ungroup selection" commands anywhere).
  Select items and click the buttons to group them under department headings
  or flatten back to a plain list:

  ````markdown
  ```grocery-buttons
  DON'T PANIC
  you can't break this in a way that matters.
  it's just how I put the buttons in place.
  ```
  ````

  The block's body is just a reassuring placeholder (it self-heals if left
  empty); the buttons act on the text you select elsewhere in the note.
- **Star chart**: add a `starchart` code block to any note:

  ````markdown
  ```starchart
  name: Everett
  totalSquares: 22
  dryCount: 3
  spentSquares: 0
  spentDate: ""
  ```
  ````

  All state and config live inside the block. The buttons update the block in
  place, so edits made here are reflected in the chart (and vice versa).
