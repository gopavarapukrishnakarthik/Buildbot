import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes/AppRoutes";
import "./index.css";
import { AuthProvider } from "./context/AuthContext"; // Optional: auth context

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {/* AuthProvider can provide user info like role/subRole */}
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </React.StrictMode>
);
