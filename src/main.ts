import "./style.css";

document.addEventListener("DOMContentLoaded", setupUI);

interface DrawableCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements DrawableCommand {
  private points: { x: number; y: number }[] = [];

  constructor(startX: number, startY: number, private thickness: number) {
    this.points.push({ x: startX, y: startY });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = this.thickness;
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (const pt of this.points) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }
}

//Tool Preview
class ToolPreview {
  constructor(
    private x: number,
    private y: number,
    private thickness: number,
  ) {}

  display(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

//Stickers
class StickerCommand implements DrawableCommand {
  constructor(private x: number, private y: number, private emoji: string) {}

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

//Sticker preview
class StickerPreview {
  constructor(private x: number, private y: number, private emoji: string) {}

  display(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 0.5;
    ctx.font = "48px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.globalAlpha = 1.0;
  }
}

function setupUI(): void {
  const title: HTMLHeadingElement = document.createElement("h1");
  title.textContent = "Sticker Sketchpad";
  document.body.appendChild(title);

  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "app-canvas";
  canvas.width = 256;
  canvas.height = 256;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!ctx) throw new Error("Canvas not supported");

  //Buttons
  const buttonContainer = document.createElement("div");

  const thinButton = document.createElement("button");
  thinButton.textContent = "Thin Marker";

  const thickButton = document.createElement("button");
  thickButton.textContent = "Thick Marker";

  const stickerButtons: HTMLButtonElement[] = [];
  const stickers = ["🌸", "⭐️", "☁️"];

  const exportButton = document.createElement("button");
  exportButton.textContent = "Export";

  const stickerContainer = document.createElement("div");

  function renderStickerButtons() {
    stickerContainer.innerHTML = "";
    stickerButtons.length = 0;
    for (const emoji of stickers) {
      const btn = document.createElement("button");
      btn.textContent = emoji;
      btn.addEventListener("click", () => {
        currentTool = "sticker";
        currentSticker = emoji;
        [thinButton, thickButton, ...stickerButtons].forEach((b) =>
          b.classList.remove("selectedTool")
        );
        btn.classList.add("selectedTool");
        canvas.dispatchEvent(new CustomEvent("tool-moved"));
      });
      stickerButtons.push(btn);
      stickerContainer.appendChild(btn);
    }

    stickerContainer.appendChild(customStickerButton);
  }

  const customStickerButton = document.createElement("button");
  customStickerButton.textContent = "➕ Custom Sticker";
  customStickerButton.addEventListener("click", () => {
    const text = prompt("Custom sticker text", "🧽");
    if (text && text.trim() !== "") {
      stickers.push(text.trim());
      renderStickerButtons();
      canvas.dispatchEvent(new CustomEvent("tool-moved"));
    }
  });

  renderStickerButtons();

  const undoButton = document.createElement("button");
  undoButton.textContent = "Undo";

  const redoButton = document.createElement("button");
  redoButton.textContent = "Redo";

  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear";

  buttonContainer.append(
    thinButton,
    thickButton,
    undoButton,
    redoButton,
    clearButton,
    exportButton,
  );
  document.body.append(buttonContainer, stickerContainer);

  //Drawing
  const lines: DrawableCommand[] = [];
  const redoLines: DrawableCommand[] = [];
  let currentLine: MarkerLine | null = null;
  let activeStickerCommand: StickerCommand | null = null;
  let toolPreview: ToolPreview | StickerPreview | null = null;
  let currentThickness = 2;
  let currentTool: "marker" | "sticker" = "marker";
  let currentSticker = stickers[0];

  ctx.strokeStyle = "black";
  ctx.lineCap = "round";

  //Select Thickness
  function selectThickness(
    thickness: number,
    selectedButton: HTMLButtonElement,
  ) {
    currentTool = "marker";
    currentThickness = thickness;
    [thinButton, thickButton, ...stickerButtons].forEach((b) =>
      b.classList.remove("selectedTool")
    );
    selectedButton.classList.add("selectedTool");
    canvas.dispatchEvent(new CustomEvent("tool-moved"));
  }

  thinButton.addEventListener("click", () => selectThickness(4, thinButton));
  thickButton.addEventListener("click", () => selectThickness(10, thickButton));
  thinButton.classList.add("selectedTool");

  canvas.addEventListener("mousedown", (e) => {
    if (currentTool === "marker") {
      currentLine = new MarkerLine(e.offsetX, e.offsetY, currentThickness);
      lines.push(currentLine);
    } else {
      activeStickerCommand = new StickerCommand(
        e.offsetX,
        e.offsetY,
        currentSticker,
      );
      lines.push(activeStickerCommand);
    }
    redoLines.length = 0;
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!currentLine && !activeStickerCommand) {
      toolPreview = currentTool === "marker"
        ? new ToolPreview(e.offsetX, e.offsetY, currentThickness)
        : new StickerPreview(e.offsetX, e.offsetY, currentSticker);
      canvas.dispatchEvent(new CustomEvent("tool-moved"));
    }

    if (currentLine) {
      currentLine.drag(e.offsetX, e.offsetY);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }

    if (activeStickerCommand) {
      activeStickerCommand.drag(e.offsetX, e.offsetY);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  });

  canvas.addEventListener("mouseup", () => {
    currentLine = null;
    activeStickerCommand = null;
    toolPreview = null;
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  canvas.addEventListener("mouseleave", () => {
    toolPreview = null;
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const cmd of lines) cmd.display(ctx);
    if (toolPreview && !currentLine && !activeStickerCommand) {
      toolPreview.display(ctx);
    }
  }

  canvas.addEventListener("drawing-changed", redraw);
  canvas.addEventListener("tool-moved", redraw);

  //Clear function
  clearButton.addEventListener("click", () => {
    lines.length = 0;
    redoLines.length = 0;
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  undoButton.addEventListener("click", () => {
    if (lines.length > 0) redoLines.push(lines.pop()!);
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  redoButton.addEventListener("click", () => {
    if (redoLines.length > 0) lines.push(redoLines.pop()!);
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  exportButton.addEventListener("click", () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;

    const exportCtx = exportCanvas.getContext("2d") as CanvasRenderingContext2D;

    exportCtx.scale(4, 4);

    for (const cmd of lines) {
      cmd.display(exportCtx);
    }

    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  });
}
