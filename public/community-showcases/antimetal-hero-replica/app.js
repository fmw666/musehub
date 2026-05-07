import { createDottedVideo } from "./hero.js";

const container = document.getElementById("hero-dotted-video");
if (container) {
  const instance = createDottedVideo(container, {});
  window.__hero = instance;
}
