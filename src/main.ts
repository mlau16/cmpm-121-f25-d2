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

  //Clear Button
  const clearButton: HTMLButtonElement = document.createElement("button");
  clearButton.textContent = "Clear";
  document.body.appendChild(clearButton);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";
  ctx.lineCap = "round";

  const cursor = { active: false, x: 0, y: 0 };

  canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
      ctx.beginPath();
      ctx.moveTo(cursor.x, cursor.y);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      cursor.x = e.offsetX;
      cursor.y = e.offsetY;
    }
  });

  canvas.addEventListener("mouseup", () => {
    cursor.active = false;
  });

  canvas.addEventListener("mouseleave", () => {
    cursor.active = false;
  });

  clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}
