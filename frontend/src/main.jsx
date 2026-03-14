import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <div className="min-h-screen bg-black text-slate-100">
      <App />
    </div>
  </BrowserRouter>
);
