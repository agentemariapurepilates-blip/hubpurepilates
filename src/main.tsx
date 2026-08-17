import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initVersionCheck } from "./lib/versionCheck";

// Recarrega sozinho quando sai um deploy novo (evita usuário preso em versão antiga).
initVersionCheck();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
