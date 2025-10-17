import "./style.css";

self.addEventListener("DOMContentLoaded", () => {
  setupUI();
});

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
  if (!ctx) return;

  //Buttons
  const buttonContainer = document.createElement("div");

  const undoButton = document.createElement("button");
  undoButton.textContent = "Undo";

  const redoButton = document.createElement("button");
  redoButton.textContent = "Redo";

  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear";

  buttonContainer.appendChild(undoButton);
  buttonContainer.appendChild(redoButton);
  buttonContainer.appendChild(clearButton);
  document.body.appendChild(buttonContainer);

  //Drawing
  const lines: { x: number; y: number }[][] = [];
  const redoLines: { x: number; y: number }[][] = [];
  let currentLine: { x: number; y: number }[] | null;

  const cursor = { active: false, x: 0, y: 0 };

  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";
  ctx.lineCap = "round";

  canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    currentLine = [];
    lines.push(currentLine);
    redoLines.splice(0, redoLines.length);
    currentLine.push({ x: cursor.x, y: cursor.y });

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (e) => {
    if (cursor.active && currentLine) {
      currentLine.push({ x: e.offsetX, y: e.offsetY });
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  });

  canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = null;

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  function redraw() {
    if (!ctx) {
      throw Error("Error! Unsupported browser.");
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
      if (line.length > 1) {
        ctx.beginPath();
        const { x, y } = line[0];
        ctx.moveTo(x, y);
        for (const { x, y } of line) {
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }

  canvas.addEventListener("drawing-changed", redraw);

  //Clear function
  function clear(): void {
    lines.splice(0, lines.length);
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
