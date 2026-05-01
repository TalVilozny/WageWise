import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { PrivacyPolicy } from "./PrivacyPolicy.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/purchase-history" element={<App />} />
        <Route path="/history" element={<App />} />
        <Route path="/spending-personality" element={<App />} />
        <Route path="/personality" element={<App />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
