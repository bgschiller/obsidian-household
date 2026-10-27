import { MarkdownRenderChild, Notice, TFile, type App } from "obsidian";
import {
  addDryDay,
  addSquares,
  ageOutExchanges,
  activeSquares,
  CHART_TITLE,
  claimDryReward,
  DRY_DAYS_PER_REWARD,
  exchangeTv,
  exchangedSquares,
  SQUARES_PER_TV,
  subtractSquare,
  type ChartState,
  type Mutation,
} from "./star-chart";

/** Interactive star chart rendered inside a ```starchart code block. */
export class StarchartWidget extends MarkdownRenderChild {
  private state: ChartState;

  constructor(
    private sourcePath: string,
    private app: App,
    containerEl: HTMLElement,
  ) {
    super(containerEl);
    this.state = this.readState();
  }

  private readState(): ChartState {
    const file = this.app.vault.getAbstractFileByPath(this.sourcePath);
    if (!(file instanceof TFile)) {
      return { totalSquares: 0, dryCount: 0, exchanges: [] };
    }
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    return {
      totalSquares: Number(fm.totalSquares) || 0,
      dryCount: Number(fm.dryCount) || 0,
      exchanges: Array.isArray(fm.exchanges) ? fm.exchanges : [],
    };
  }

  async onload() {
    const aged = ageOutExchanges(this.state);
    if (aged.removed > 0) {
      this.state = aged.state;
      await this.writeState();
    }
    this.render();
  }

  private async writeState(): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(this.sourcePath);
    if (!(file instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm.totalSquares = this.state.totalSquares;
      fm.dryCount = this.state.dryCount;
      fm.exchanges = this.state.exchanges;
    });
  }

  private async mutate(fn: (s: ChartState) => Mutation): Promise<void> {
    const aged = ageOutExchanges(this.state);
    this.state = aged.state;
    if (aged.removed > 0) await this.writeState();

    const result = fn(this.state);
    if (result.error) {
      new Notice(result.error);
      return;
    }
    this.state = result.state;
    await this.writeState();
    this.render();
  }

  private isSquareExchanged(squareNum: number): boolean {
    return this.state.exchanges.some(
      (e) => squareNum >= e.squareRange[0] && squareNum <= e.squareRange[1],
    );
  }

  private render(): void {
    const el = this.containerEl;
    el.empty();

    const root = el.createDiv({ cls: "household-starchart" });
    root.createEl("h2", { text: `🎉 ${CHART_TITLE}` });

    const active = activeSquares(this.state);
    const tvUsedToday = this.state.exchanges.length * SQUARES_PER_TV;
    const availableTv = Math.floor(active / SQUARES_PER_TV) * SQUARES_PER_TV;

    const stats = root.createDiv({ cls: "household-stats" });
    stats.createDiv({ cls: "household-stat" }).createSpan({ text: `${active}`, cls: "household-stat-value" }).parentElement?.createSpan({ text: "Squares", cls: "household-stat-label" });
    stats.createDiv({ cls: "household-stat" }).createSpan({ text: `${availableTv} min`, cls: "household-stat-value" }).parentElement?.createSpan({ text: "Available TV", cls: "household-stat-label" });
    stats.createDiv({ cls: "household-stat" }).createSpan({ text: `${tvUsedToday} min`, cls: "household-stat-value" }).parentElement?.createSpan({ text: "TV Used Today", cls: "household-stat-label" });

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
    dry.createEl("p", { text: `${this.state.dryCount} / ${DRY_DAYS_PER_REWARD}`, cls: "household-dry-count" });
    const dryButtons = dry.createDiv({ cls: "household-buttons" });
    this.addButton(dryButtons, "All Day Dry!", () => this.mutate((s) => addDryDay(s)));
    this.addButton(dryButtons, "Big Reward", () => this.mutate((s) => claimDryReward(s)));
  }

  private addButton(parent: HTMLElement, label: string, onClick: () => void): void {
    const btn = parent.createEl("button", { text: label, cls: "household-btn" });
    this.registerDomEvent(btn, "click", (ev) => {
      ev.preventDefault();
      onClick();
    });
  }
}
