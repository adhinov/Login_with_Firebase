// src/components/EditProfileForm.tsx
"use client";

import { ArrowLeft, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function EditProfileForm() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;

    const u = JSON.parse(stored);

    setUsername(u.username || "");
    setEmail(u.email || "");
    setPhone(u.phone || "");

    // Avatar pakai Cloudinary full URL dari backend
    setAvatarUrl(u.avatar || null);
  }, []);

  // Preview avatar
  const handleAvatarChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files allowed.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert("Max size 3MB.");
      return;
    }

    setNewAvatar(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  // Save profile
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Session expired");

      const form = new FormData();
      form.append("username", username);
      form.append("phone", phone);

      if (newAvatar) form.append("avatar", newAvatar);

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/update-profile`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Profile updated!");
      router.push("/chat");
    } catch (err) {
      console.log(err);
      alert("Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-[#071422] py-10 px-4">
      <div className="relative bg-[#0D1B2A] rounded-2xl border border-gray-700 shadow-xl 
                      w-full max-w-lg p-8">

        <h2 className="text-xl font-semibold text-green-400 mb-6">Edit Profile</h2>

        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-green-400 
                            flex items-center justify-center shadow-md">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </div>

            <label className="mt-4 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white 
                              flex items-center gap-2 cursor-pointer text-sm shadow-md">
              <Upload size={16} /> Upload
              <input type="file" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-2 py-3 bg-transparent border-b border-gray-600 text-white 
                           focus:outline-none focus:border-blue-500 text-sm peer"
              />
              <label
                className={`absolute left-2 transition-all 
                  ${username ? "-top-3 text-xs text-blue-400" : "top-3 text-sm"}
                `}
              >
                Username
              </label>
            </div>

            {/* Email (read only) */}
            <div className="relative opacity-60">
              <input
                type="text"
                value={email}
                disabled
                className="w-full px-2 py-3 bg-transparent border-b border-gray-700 
                           text-gray-400 text-sm"
              />
              <label className="absolute left-2 -top-3 text-xs text-gray-500">
                Email
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-2 py-3 bg-transparent border-b border-gray-600 text-white 
                           focus:outline-none focus:border-blue-500 text-sm peer"
              />
              <label
                className={`absolute left-2 transition-all 
                  ${phone ? "-top-3 text-xs text-blue-400" : "top-3 text-sm"}
                `}
              >
                Phone Number
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-10">
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-2 text-gray-300 hover:text-white text-sm"
          >
            <ArrowLeft size={16} /> Back to Chat
          </button>

          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold 
                       px-6 py-2 rounded-lg shadow-md"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
