import "./style.css";

self.addEventListener("DOMContentLoaded", () => {
  setupUI();
});

interface DrawableCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements DrawableCommand {
  private points: { x: number; y: number }[] = [];
  private thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.points.push({ x: startX, y: startY });
    this.thickness = thickness;
  }

  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D): void {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = this.thickness;
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (const pt of this.points) {
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }
}

//Tool Preview
class ToolPreview {
  private x: number;
  private y: number;
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  display(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

//Stickers
class StickerCommand implements DrawableCommand {
  private x: number;
  private y: number;
  private emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  drag(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D): void {
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

//Sticker preview
class StickerPreview {
  private x: number;
  private y: number;
  private emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  display(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 0.5;
    ctx.font = "32px serif";
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

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  //Buttons
  const buttonContainer = document.createElement("div");

  const thinButton = document.createElement("button");
  thinButton.textContent = "Thin Marker";

  const thickButton = document.createElement("button");
  thickButton.textContent = "Thick Marker";

  const stickerButtons: HTMLButtonElement[] = [];
  const stickers = ["🌸", "⭐️", "☁️"];
  for (const emoji of stickers) {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    stickerButtons.push(btn);
    buttonContainer.appendChild(btn);
  }

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
  );
  document.body.appendChild(buttonContainer);

  //Drawing
  const lines: DrawableCommand[] = [];
  const redoLines: DrawableCommand[] = [];
  let currentLine: MarkerLine | null = null;
  let toolPreview: ToolPreview | StickerPreview | null = null;
  let currentThickness = 2;
  let currentTool: "marker" | "sticker" = "marker";
  let currentSticker: string = stickers[0];
  let activeStickerCommand: StickerCommand | null = null;

  ctx.strokeStyle = "black";
  ctx.lineCap = "round";

  //Select Thickness
  function selectThickness(
    thickness: number,
    selectedButton: HTMLButtonElement,
  ): void {
    currentThickness = thickness;

    [thinButton, thickButton].forEach((btn) =>
      btn.classList.remove("selectedTool")
    );
    selectedButton.classList.add("selectedTool");
  }

  thinButton.addEventListener("click", () => selectThickness(2, thinButton));
  thickButton.addEventListener("click", () => selectThickness(6, thickButton));

  thinButton.classList.add("selectedTool");

  //Select Sticker
  for (const btn of stickerButtons) {
    btn.addEventListener("click", () => {
      currentTool = "sticker";
      currentSticker = btn.textContent ?? "";
      [thinButton, thickButton, ...stickerButtons].forEach((b) =>
        b.classList.remove("selectedTool")
      );
      btn.classList.add("selectedTool");
      canvas.dispatchEvent(new CustomEvent("tool-moved"));
    });
  }

  canvas.addEventListener("mousedown", (e) => {
    if (currentTool === "marker") {
      currentLine = new MarkerLine(e.offsetX, e.offsetY, currentThickness);
      lines.push(currentLine);
    } else if (currentTool === "sticker") {
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
      if (currentTool === "marker") {
        toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness);
      } else if (currentTool === "sticker") {
        toolPreview = new StickerPreview(e.offsetX, e.offsetY, currentSticker);
      }
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
    if (!ctx) {
      throw Error("Error! Unsupported browser.");
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const cmd of lines) {
      cmd.display(ctx);
    }
    if (toolPreview && !currentLine) {
      toolPreview.display(ctx);
    }
  }

  canvas.addEventListener("drawing-changed", redraw);
  canvas.addEventListener("tool-moved", redraw);

  //Clear function
  function clear(): void {
    lines.length = 0;
    redoLines.length = 0;
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  }

  clearButton.addEventListener("click", clear);

  //Undo function
  function undo(): void {
    if (lines.length > 0) {
      const popped = lines.pop()!;
      redoLines.push(popped);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  }

  undoButton.addEventListener("click", undo);

  //Redo function
  function redo(): void {
    if (redoLines.length > 0) {
      const restored = redoLines.pop()!;
      lines.push(restored);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  }

  redoButton.addEventListener("click", redo);
}
