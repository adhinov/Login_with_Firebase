import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "./login/page";
import SignupPage from "./signup/page";
import WelcomePage from "./welcome/page";
import AdminDashboard from "./adminDashboard/page";
import ProtectedRoute from "../components/ProtectedRoute";

// definisi router
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/welcome",
    element: (
      <ProtectedRoute requiredRole="user">
        <WelcomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/adminDashboard",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <LoginPage />, // fallback kalau route tidak ditemukan
  },
]);

// komponen utama untuk dipanggil di entry point (misal src/main.tsx)
export default function AppRouter() {
  return <RouterProvider router={router} />;
}
