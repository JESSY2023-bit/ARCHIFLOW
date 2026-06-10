import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function PrivateRoute({ children, roles }) {
  const { user, token } = useAuthStore();

  // Non connecté → login
  if (!token) return <Navigate to="/login" replace />;

  // Rôle non autorisé → page non autorisée
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}