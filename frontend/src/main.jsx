import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import LoginPage          from "./pages/LoginPage";
import DashboardPage      from "./pages/DashboardPage";
import ArchivesPage       from "./pages/ArchivesPage";
import UploadPage         from "./pages/UploadPage";
import UsersPage          from "./pages/UsersPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import ProfilePage        from "./pages/ProfilePage";
import UnauthorizedPage   from "./pages/UnauthorizedPage";
import CategoriesPage     from "./pages/CategoriesPage";
import NotFoundPage       from "./pages/NotFoundPage";
import PrivateRoute       from "./components/PrivateRoute";
import Layout             from "./components/Layout";
import SetPasswordPage from "./pages/SetPasswordPage";
import { applyTheme } from "./config/theme";

applyTheme();

createRoot(document.getElementById("root")).render(  );

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        <Route path="/login"        element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/set-password/:token" element={<SetPasswordPage />} /> 

        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Admin + Éditeur */}
          <Route path="/dashboard"
            element={
              <PrivateRoute roles={["admin", "editeur"]}>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          {/* Tous les rôles */}
          <Route path="/archives"     element={<ArchivesPage />} />
          <Route path="/archives/:id" element={<DocumentDetailPage />} />
          <Route path="/profile"      element={<ProfilePage />} />

          {/* Admin + Éditeur uniquement */}
          <Route path="/upload"
            element={
              <PrivateRoute roles={["admin", "editeur"]}>
                <UploadPage />
              </PrivateRoute>
            }
          />

          {/* Admin uniquement */}
          <Route path="/users"
            element={
              <PrivateRoute roles={["admin"]}>
                <UsersPage />
              </PrivateRoute>
            }
          />

          {/*Catégories — Admin uniquement */}
          <Route path="/categories"
            element={
              <PrivateRoute roles={["admin"]}>
                <CategoriesPage />
              </PrivateRoute>
            }
          />

        </Route>

        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>
);