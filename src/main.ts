import {
  MarkdownView,
  Notice,
  Plugin,
  type Editor,
  type MarkdownPostProcessorContext,
} from "obsidian";
import { groupText, isGrouped, ungroupText } from "./grocery";
import { StarchartWidget } from "./starchart-block";

const GROCERIES_FILE = "Groceries.md";

export default class HouseholdPlugin extends Plugin {
  async onload() {
    this.addRibbonIcon("shopping-cart", "Toggle grocery grouping", () =>
      this.toggleActiveSelection(),
    );

    this.addCommand({
      id: "group-groceries",
      name: "Group selection by department",
      editorCheckCallback: (checking, editor, view) => {
        const ok = view.file?.name === GROCERIES_FILE;
        if (checking) return ok;
        if (!ok) {
          new Notice(`Open ${GROCERIES_FILE} to group groceries.`);
          return;
        }
        this.groupSelection(editor);
      },
    });

    this.addCommand({
      id: "ungroup-groceries",
      name: "Ungroup selection (flatten list)",
      editorCheckCallback: (checking, editor, view) => {
        const ok = view.file?.name === GROCERIES_FILE;
        if (checking) return ok;
        if (!ok) {
          new Notice(`Open ${GROCERIES_FILE} to ungroup groceries.`);
          return;
        }
        this.ungroupSelection(editor);
      },
    });

    this.registerMarkdownCodeBlockProcessor(
      "starchart",
      (source, el, ctx: MarkdownPostProcessorContext) => {
        ctx.addChild(new StarchartWidget(ctx.sourcePath, this.app, el));
      },
    );
  }

  private groupSelection(editor: Editor): void {
    const selection = editor.getSelection();
    if (!selection.trim()) {
      new Notice("Select the grocery items you want to group.");
      return;
    }
    editor.replaceSelection(groupText(selection));
  }

  private ungroupSelection(editor: Editor): void {
    const selection = editor.getSelection();
    if (selection.trim()) {
      editor.replaceSelection(ungroupText(selection));
    } else {
      editor.setValue(ungroupText(editor.getValue()));
    }
  }

  private toggleActiveSelection(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || view.file?.name !== GROCERIES_FILE) {
      new Notice(`Open ${GROCERIES_FILE} to toggle grocery grouping.`);
      return;
    }
    this.toggleSelection(view.editor);
  }

  private toggleSelection(editor: Editor): void {
    const selection = editor.getSelection();
    if (selection.trim()) {
      editor.replaceSelection(
        isGrouped(selection) ? ungroupText(selection) : groupText(selection),
      );
      return;
    }
    const value = editor.getValue();
    editor.setValue(isGrouped(value) ? ungroupText(value) : groupText(value));
  }
}
