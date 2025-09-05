import "./global.css";
import { createRoot, type Root } from "react-dom/client";
import App from "./App";

declare global {
  interface Window {
    __app_root?: Root;
  }
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("#root container not found");
}

const root = window.__app_root ?? createRoot(container);
window.__app_root = root;
root.render(<App />);
