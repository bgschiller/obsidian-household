import {
  MarkdownRenderChild,
  MarkdownView,
  TFile,
  type App,
  type Editor,
  type MarkdownPostProcessorContext,
} from "obsidian";
import { regroupText, ungroupText } from "./grocery";

/** Body written into an empty ```grocery-buttons block (visible in edit mode only). */
const DONT_PANIC = [
  "DON'T PANIC",
  "you can't break this in a way that matters.",
  "it's just how I put the buttons in place.",
].join("\n");

/** Group/Ungroup buttons rendered inside a ```grocery-buttons code block. */
export class GroceryButtonsWidget extends MarkdownRenderChild {
  constructor(
    private source: string,
    private ctx: MarkdownPostProcessorContext,
    private app: App,
    containerEl: HTMLElement,
  ) {
    super(containerEl);
  }

  async onload() {
    if (this.source.trim() === "") {
      await this.writeBlock(DONT_PANIC);
    }
    this.render();
  }

  private render(): void {
    const el = this.containerEl;
    el.empty();
    const root = el.createDiv({ cls: "household-buttons" });
    this.addButton(root, "Group", () => this.groupSelection());
    this.addButton(root, "Ungroup", () => this.ungroupSelection());
  }

  private addButton(parent: HTMLElement, label: string, onClick: () => void): void {
    const btn = parent.createEl("button", { text: label, cls: "household-btn" });
    this.registerDomEvent(btn, "click", (ev) => {
      ev.preventDefault();
      onClick();
    });
  }

  private activeEditor(): Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.editor ?? null;
  }

  private groupSelection(): void {
    const editor = this.activeEditor();
    if (!editor) return;
    const selection = editor.getSelection();
    if (selection.trim()) {
      editor.replaceSelection(regroupText(selection));
    } else {
      editor.setValue(regroupText(editor.getValue()));
    }
  }

  private ungroupSelection(): void {
    const editor = this.activeEditor();
    if (!editor) return;
    const selection = editor.getSelection();
    if (selection.trim()) {
      editor.replaceSelection(ungroupText(selection));
    } else {
      editor.setValue(ungroupText(editor.getValue()));
    }
  }

  /** Rewrite the ```grocery-buttons block in the note with the given body. */
  private async writeBlock(body: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
    if (!(file instanceof TFile)) return;

    const section = this.ctx.getSectionInfo(this.containerEl);

    await this.app.vault.process(file, (data) => {
      const lines = data.split("\n");
      const range = findFenceRange(lines, section?.lineStart ?? null);
      if (!range) return data;
      const block = ["```grocery-buttons", body, "```"];
      return [
        ...lines.slice(0, range.start),
        ...block,
        ...lines.slice(range.end + 1),
      ].join("\n");
    });
  }
}

function findOpeningFence(lines: string[], from: number): number | null {
  for (let i = Math.max(0, from); i < lines.length; i++) {
    if (/^```grocery-buttons\s*$/.test(lines[i].trim())) return i;
  }
  return null;
}

function findFenceRange(
  lines: string[],
  hintStart: number | null,
): { start: number; end: number } | null {
  const start =
    (hintStart !== null ? findOpeningFence(lines, hintStart) : null) ??
    findOpeningFence(lines, 0);
  if (start === null) return null;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^```+\s*$/.test(lines[i].trim())) return { start, end: i };
  }
  return null;
}
