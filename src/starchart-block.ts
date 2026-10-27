import {
  MarkdownRenderChild,
  Notice,
  TFile,
  type App,
  type MarkdownPostProcessorContext,
} from "obsidian";
import {
  activeSquares,
  addDryDay,
  addSquares,
  ageOutSpending,
  claimDryReward,
  DRY_DAYS_PER_REWARD,
  exchangeTv,
  parseState,
  serializeState,
  SQUARES_PER_TV,
  subtractSquare,
  type ChartState,
  type Mutation,
} from "./star-chart";

/** Interactive star chart rendered inside a ```starchart code block. */
export class StarchartWidget extends MarkdownRenderChild {
  private state: ChartState;

  constructor(
    source: string,
    private ctx: MarkdownPostProcessorContext,
    private app: App,
    containerEl: HTMLElement,
  ) {
    super(containerEl);
    this.state = parseState(source);
  }

  async onload() {
    const aged = ageOutSpending(this.state);
    if (aged.changed) {
      this.state = aged.state;
      await this.writeBlock();
    }
    this.render();
  }

  /** Rewrite the ```starchart block in the note with the current state. */
  private async writeBlock(): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
    if (!(file instanceof TFile)) return;

    const section = this.ctx.getSectionInfo(this.containerEl);
    const serialized = serializeState(this.state);

    await this.app.vault.process(file, (data) => {
      const lines = data.split("\n");
      const range = findFenceRange(lines, section?.lineStart ?? null);
      if (!range) return data;
      const block = ["```starchart", serialized, "```"];
      return [
        ...lines.slice(0, range.start),
        ...block,
        ...lines.slice(range.end + 1),
      ].join("\n");
    });
  }

  private async mutate(fn: (s: ChartState) => Mutation): Promise<void> {
    const aged = ageOutSpending(this.state);
    this.state = aged.state;

    const result = fn(this.state);
    if (result.error) {
      if (aged.changed) await this.writeBlock();
      new Notice(result.error);
      this.render();
      return;
    }
    this.state = result.state;
    await this.writeBlock();
    this.render();
  }

  private isSquareExchanged(squareNum: number): boolean {
    return squareNum <= this.state.spentSquares;
  }

  private render(): void {
    const el = this.containerEl;
    el.empty();

    const root = el.createDiv({ cls: "household-starchart" });
    const title = this.state.name ? `${this.state.name}'s Potty Chart` : "Potty Chart";
    root.createEl("h2", { text: `🎉 ${title}` });

    const active = activeSquares(this.state);
    const availableTv = Math.floor(active / SQUARES_PER_TV) * SQUARES_PER_TV;

    const stats = root.createDiv({ cls: "household-stats" });
    this.addStat(stats, `${active}`, "Squares");
    this.addStat(stats, `${availableTv} min`, "Available TV");
    this.addStat(stats, `${this.state.spentSquares} min`, "TV Used Today");

    const grid = root.createDiv({ cls: "household-grid" });
    const numRows = Math.max(1, Math.ceil(this.state.totalSquares / SQUARES_PER_TV));
    for (let row = 0; row < numRows; row++) {
      const rowEl = grid.createDiv({ cls: "household-grid-row" });
      const squaresRow = rowEl.createDiv({ cls: "household-squares-row" });

      let allExchanged = true;
      let allActiveAndFull = true;
      for (let col = 0; col < SQUARES_PER_TV; col++) {
        const squareNum = row * SQUARES_PER_TV + col + 1;
        const isExchanged = this.isSquareExchanged(squareNum);
        const isActive = squareNum <= this.state.totalSquares && !isExchanged;

        if (!isExchanged) allExchanged = false;
        if (squareNum > this.state.totalSquares || isExchanged) allActiveAndFull = false;

        squaresRow.createDiv({
          cls: `household-square ${isExchanged ? "is-exchanged" : isActive ? "is-active" : "is-empty"}`,
          text: isActive ? "■" : "",
        });
      }
      rowEl.createSpan({
        cls: "household-row-star",
        text: allExchanged ? "" : allActiveAndFull ? "⭐" : "☆",
      });
    }

    const buttons = root.createDiv({ cls: "household-buttons" });
    this.addButton(buttons, "+1", () => this.mutate((s) => addSquares(s, 1)));
    this.addButton(buttons, "+10", () => this.mutate((s) => addSquares(s, 10)));
    this.addButton(buttons, "−1", () => this.mutate((s) => subtractSquare(s)));
    this.addButton(buttons, "⭐ TV Time", () => this.mutate((s) => exchangeTv(s)));

    const dry = root.createDiv({ cls: "household-dry" });
    dry.createEl("h3", { text: "All Day Dry" });
    const track = dry.createDiv({ cls: "household-dry-track" });
    track.createDiv({
      cls: "household-dry-fill",
      attr: {
        style: `width: ${Math.min(100, (this.state.dryCount / DRY_DAYS_PER_REWARD) * 100)}%`,
      },
    });
    dry.createEl("p", {
      text: `${this.state.dryCount} / ${DRY_DAYS_PER_REWARD}`,
      cls: "household-dry-count",
    });
    const dryButtons = dry.createDiv({ cls: "household-buttons" });
    this.addButton(dryButtons, "All Day Dry!", () => this.mutate((s) => addDryDay(s)));
    this.addButton(dryButtons, "Big Reward", () => this.mutate((s) => claimDryReward(s)));
  }

  private addStat(parent: HTMLElement, value: string, label: string): void {
    const stat = parent.createDiv({ cls: "household-stat" });
    stat.createSpan({ text: value, cls: "household-stat-value" });
    stat.createSpan({ text: label, cls: "household-stat-label" });
  }

  private addButton(parent: HTMLElement, label: string, onClick: () => void): void {
    const btn = parent.createEl("button", { text: label, cls: "household-btn" });
    this.registerDomEvent(btn, "click", (ev) => {
      ev.preventDefault();
      onClick();
    });
  }
}

function findOpeningFence(lines: string[], from: number): number | null {
  for (let i = Math.max(0, from); i < lines.length; i++) {
    if (/^```starchart\s*$/.test(lines[i].trim())) return i;
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
