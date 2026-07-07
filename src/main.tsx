import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import USOnlyGuard from "./components/ui/USOnlyGuard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <USOnlyGuard>
      <App />
    </USOnlyGuard>
  </React.StrictMode>
);