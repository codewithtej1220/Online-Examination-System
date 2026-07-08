import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  document.body.innerHTML = "<p style=\"padding:24px;font-family:sans-serif\">Unable to start OES: root element was not found.</p>";
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
}
