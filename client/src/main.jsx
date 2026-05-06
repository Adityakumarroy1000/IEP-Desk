import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProfileProvider } from "./context/ProfileContext.jsx";
import AppErrorBoundary from "./components/ui/AppErrorBoundary.jsx";

if (typeof window !== "undefined") {
  window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  window.addEventListener("keydown", (event) => {
    const key = String(event.key || "").toLowerCase();
    const isInspectShortcut =
      key === "f12" ||
      (event.ctrlKey && event.shiftKey && (key === "i" || key === "j" || key === "c")) ||
      (event.ctrlKey && key === "u");

    if (isInspectShortcut) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ProfileProvider>
            <App />
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);
