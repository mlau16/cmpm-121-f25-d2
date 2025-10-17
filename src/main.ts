
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
}