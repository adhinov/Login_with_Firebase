// src/components/welcome.tsx
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-96 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Welcome {user.username || "Guest"}
        </h1>
        <p className="mb-6 text-gray-700">Email : {user.email || "-"}</p>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
