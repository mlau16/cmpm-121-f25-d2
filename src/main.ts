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

  const lines: { x: number; y: number }[][] = [];
  const redoLines: { x: number; y: number }[][] = [];

  let currentLine: { x: number; y: number }[] | null;

  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";
  ctx.lineCap = "round";

  const cursor = { active: false, x: 0, y: 0 };

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
    if (!currentLine) {
      throw Error("");
    }
    if (cursor.active) {
      //ctx.beginPath();
      //ctx.moveTo(cursor.x, cursor.y);
      //ctx.lineTo(e.offsetX, e.offsetY);
      //ctx.stroke();
      cursor.x = e.offsetX;
      cursor.y = e.offsetY;
    }
    currentLine.push({ x: cursor.x, y: cursor.y });

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = null;

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  });

  // canvas.addEventListener("mouseleave", () => {
  //   cursor.active = false;

  //   canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  // });

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
}
