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
    clearButton
  );
  document.body.appendChild(buttonContainer);

  //Drawing
  const lines: DrawableCommand[] = [];
  const redoLines: DrawableCommand[] = [];
  let currentLine: MarkerLine | null = null;
  let currentThickness = 2;

  ctx.strokeStyle = "black";
  ctx.lineCap = "round";

  //Select Thickness
  function selectThickness(thickness: number, selectedButton: HTMLButtonElement): void{
    currentThickness = thickness;

    [thinButton, thickButton].forEach((btn) => btn.classList.remove("selectedTool"));
    selectedButton.classList.add("selectedTool");
  }

  thinButton.addEventListener("click", () => selectThickness(2, thinButton));
  thickButton.addEventListener("click", () => selectThickness(6, thickButton));

  thinButton.classList.add("selectedTool");

  canvas.addEventListener("mousedown", (e) => {
    currentLine = new MarkerLine(e.offsetX, e.offsetY, currentThickness);
    lines.push(currentLine);
    redoLines.length = 0;

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (e) => {
    if (currentLine) {
      currentLine.drag(e.offsetX, e.offsetY);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  });

  canvas.addEventListener("mouseup", () => {
    currentLine = null;

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
  }

  canvas.addEventListener("drawing-changed", redraw);

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
