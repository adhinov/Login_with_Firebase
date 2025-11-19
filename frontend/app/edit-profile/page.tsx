"use client";

import { ArrowLeft, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function EditProfile() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);

  // Load user data
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    setUsername(u.username || "");
    setEmail(u.email || "");
    setPhone(u.phone || "");
    setAvatarUrl(u.avatar || null);
  }, []);

  const handleAvatarChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewAvatar(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Session expired!");

      const form = new FormData();
      form.append("username", username);
      form.append("email", email);
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
      alert("Updated!");
      router.push("/chat");
    } catch (err) {
      alert("Failed to update profile");
      console.log(err);
    }
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-center px-4 bg-[#071422] py-10">

      <div className="w-full max-w-2xl bg-[#0d1b2a] rounded-2xl p-10 shadow-xl border border-gray-700 relative">

        {/* Back Button */}
        <button
          onClick={() => router.push("/chat")}
          className="absolute left-6 top-6 flex items-center gap-1 text-green-400 hover:text-green-300"
        >
          <ArrowLeft size={20} /> Back to Chat
        </button>

        {/* Title */}
        <h2 className="text-center text-3xl font-bold text-green-400 mb-10">
          User Profile
        </h2>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-40 rounded-full bg-green-400 border-4 border-green-300 shadow-lg flex items-center justify-center text-6xl font-semibold text-black overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                className="w-full h-full object-cover"
              />
            ) : (
              username.charAt(0).toUpperCase()
            )}
          </div>

          {/* Upload Button */}
          <label className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg cursor-pointer flex items-center gap-2 shadow-md">
            <Upload size={18} /> Upload
            <input type="file" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-5">

          <div>
            <label className="text-gray-300 text-sm">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 p-3 bg-[#1b263b] text-white rounded-lg border border-green-400"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm">Email</label>
            <input
              value={email}
              disabled
              className="w-full mt-1 p-3 bg-[#1b263b] text-white rounded-lg border border-green-400 opacity-60"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-1 p-3 bg-[#1b263b] text-white rounded-lg border border-green-400"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleSave}
            className="bg-green-400 hover:bg-green-300 text-black font-bold px-10 py-3 rounded-full shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
