// app/edit-profile/page.tsx

"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function EditProfilePage() {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ambil user dari localStorage
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      const parsed = JSON.parse(u);
      setUsername(parsed.username || parsed.name || "");
      setAvatar(parsed.avatar || null);
    }
  }, []);

  // handle upload avatar
  const handleAvatarSelect = (file: File) => {
    setAvatarFile(file);

    // preview langsung
    const url = URL.createObjectURL(file);
    setAvatar(url);
  };

  // save changes
  const saveChanges = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Session expired, please login again.");

    const form = new FormData();
    form.append("username", username);
    if (avatarFile) form.append("avatar", avatarFile);

    try {
      const res = await axios.put(`${API_URL}/api/users/update-profile`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // update local user
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Profile updated successfully!");
      window.location.href = "/chat";
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-900 px-4 py-6">
      <div className="bg-gray-850 border border-gray-700 p-6 rounded-xl shadow-xl w-full max-w-md">

        {/* Back to chat */}
        <button
          onClick={() => (window.location.href = "/chat")}
          className="text-blue-400 text-sm mb-3 hover:underline"
        >
          ← Back to chat
        </button>

        <h2 className="text-white text-xl font-semibold text-center mb-5">
          Edit Profile
        </h2>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gray-700 overflow-hidden border border-gray-600 flex items-center justify-center">
              {avatar ? (
                <img
                  src={avatar}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No Photo</span>
              )}
            </div>

            {/* Upload button */}
            <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleAvatarSelect(e.target.files[0])}
              />
              <span className="text-white text-xs">📷</span>
            </label>
          </div>
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="text-gray-300 text-sm">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 outline-none"
          />
        </div>

        {/* Save button */}
        <button
          onClick={saveChanges}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold mt-4"
        >
          Save Changes
        </button>

      </div>
    </div>
  );
}
