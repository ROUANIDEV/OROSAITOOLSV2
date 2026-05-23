import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";
import { notifyFrontendReady } from "./lib/startup";
import { ThemeProvider } from "./features/theme/theme-provider";

function StartupReadySignal() {
  useEffect(() => {
    void notifyFrontendReady();
  }, []);

  return null;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system">
      <StartupReadySignal />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);