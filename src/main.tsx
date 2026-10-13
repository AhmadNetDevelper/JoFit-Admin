import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/app";
import { apiConfig } from "./config";
import { startStorefrontBridge } from "./features/dev-bridge";
import "./styles/globals.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root was not found.");
}

/*
 * With mock data, mirror the storefront's store first (it gives up after 1.5s
 * and the admin runs on its own fixtures), so the first screen staff see is
 * already the live one rather than a fixture that changes under them.
 */
if (apiConfig.dataSource === "mock") await startStorefrontBridge();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
