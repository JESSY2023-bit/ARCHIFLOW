import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import LoginPage      from "./pages/LoginPage";
import DashboardPage  from "./pages/DashboardPage";
import PrivateRoute   from "./components/PrivateRoute";
import Layout         from "./components/Layout";
import DocumentDetailPage from "./pages/DocumentDetailPage";

// Pages à venir (placeholders pour l'instant)
import ArchivesPage from "./pages/ArchivesPage";
import UploadPage from "./pages/UploadPage";
import UsersPage from "./pages/UsersPage";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<LoginPage />} />

        {/* Toutes les pages protégées partagent le Layout */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/archives"  element={<ArchivesPage />} />
           <Route path="/archives/:id" element={<DocumentDetailPage />} />
          <Route path="/upload"    element={<UploadPage />} />
          <Route path="/users"     element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>
);