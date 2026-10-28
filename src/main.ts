import {
  Notice,
  Plugin,
  type Editor,
  type MarkdownPostProcessorContext,
} from "obsidian";
import { regroupText, ungroupText } from "./grocery";
import { GroceryButtonsWidget } from "./grocery-buttons";
import { StarchartWidget } from "./starchart-block";

export default class HouseholdPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "group-groceries",
      name: "Group selection by department",
      editorCallback: (editor) => this.groupSelection(editor),
    });

    this.addCommand({
      id: "ungroup-groceries",
      name: "Ungroup selection (flatten list)",
      editorCallback: (editor) => this.ungroupSelection(editor),
    });

    this.registerMarkdownCodeBlockProcessor(
      "starchart",
      (source, el, ctx: MarkdownPostProcessorContext) => {
        ctx.addChild(new StarchartWidget(source, ctx, this.app, el));
      },
    );

    this.registerMarkdownCodeBlockProcessor(
      "grocery-buttons",
      (source, el, ctx: MarkdownPostProcessorContext) => {
        ctx.addChild(new GroceryButtonsWidget(source, ctx, this.app, el));
      },
    );
  }

  private groupSelection(editor: Editor): void {
    const selection = editor.getSelection();
    if (!selection.trim()) {
      new Notice("Select the grocery items you want to group.");
      return;
    }
    editor.replaceSelection(regroupText(selection));
  }

  private ungroupSelection(editor: Editor): void {
    const selection = editor.getSelection();
    if (selection.trim()) {
      editor.replaceSelection(ungroupText(selection));
    } else {
      editor.setValue(ungroupText(editor.getValue()));
    }
  }
}
