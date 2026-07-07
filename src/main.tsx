import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import 
USOnlyGuard from "./components/USOnlyGuard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <USOnlyGuard>
      <App />
    </USOnlyGuard>
  </React.StrictMode>
);