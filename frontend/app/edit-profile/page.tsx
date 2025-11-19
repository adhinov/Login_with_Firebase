"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";

export default function EditProfile() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);

  // ----------------------------------------------------
  // 1. Ambil data user dari localStorage
  // ----------------------------------------------------
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return;

    const parsed = JSON.parse(userData);

    setUsername(parsed.username || "");
    setEmail(parsed.email || "");
    setPhone(parsed.phone || "");
    setAvatarUrl(parsed.avatar || null);
  }, []);

  // ----------------------------------------------------
  // 2. Upload dan preview avatar baru
  // ----------------------------------------------------
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setNewAvatar(file);
    setAvatarUrl(URL.createObjectURL(file)); // preview langsung
  };

  // ----------------------------------------------------
  // 3. Simpan Data
  // ----------------------------------------------------
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Login expired!");

      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("phone", phone);

      if (newAvatar) {
        formData.append("avatar", newAvatar);
      }

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/update-profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update localStorage biar langsung tampil di header chat
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Profile updated!");
      router.push("/chat");
    } catch (err) {
      alert("Failed to update profile!");
      console.log(err);
    }
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-center px-4 py-10 bg-[#071422]">

      {/* CARD */}
      <div className="w-full max-w-3xl bg-[#0d1b2a] p-8 rounded-xl shadow-lg border border-gray-700">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <button
            className="flex items-center gap-2 text-green-400 hover:text-green-300"
            onClick={() => router.push("/chat")}
          >
            <ArrowLeft size={20} />
            Back to chat
          </button>

          <h1 className="text-2xl font-bold text-green-400 text-center w-full">
            Edit Profile
          </h1>
        </div>

        {/* AVATAR */}
        <div className="w-full flex flex-col items-center mb-6">
          <div className="w-40 h-40 rounded-full bg-green-500 flex items-center justify-center text-6xl font-bold text-black overflow-hidden border-4 border-green-300 shadow-lg">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              username.charAt(0).toUpperCase()
            )}
          </div>

          <label
            className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-500"
          >
            <Upload size={18} />
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        {/* FORM */}
        <div className="space-y-4 mt-4">

          {/* Username */}
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">Username</label>
            <input
              className="w-full bg-[#1b263b] p-3 rounded-lg border border-green-400 text-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">Email</label>
            <input
              disabled
              className="w-full bg-[#1b263b] p-3 rounded-lg border border-green-400 text-white opacity-60"
              value={email}
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">Phone Number</label>
            <input
              className="w-full bg-[#1b263b] p-3 rounded-lg border border-green-400 text-white"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSave}
            className="bg-green-400 hover:bg-green-300 text-black font-semibold px-10 py-3 rounded-full shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
