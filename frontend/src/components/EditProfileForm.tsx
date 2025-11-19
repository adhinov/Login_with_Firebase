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
      if (!token) return alert("Session expired");

      const form = new FormData();
      form.append("username", username);
      form.append("email", email);
      form.append("phone", phone);
      if (newAvatar) form.append("avatar", newAvatar);

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/update-profile`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Updated!");
      router.push("/chat");
    } catch (err) {
      alert("Failed to update");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#071422] flex justify-center items-start py-16 px-4">

      <div className="relative bg-[#0D1B2A] border border-gray-700 rounded-2xl shadow-xl 
                      w-full max-w-2xl p-10">

        {/* TITLE LEFT TOP */}
        <h2 className="text-3xl font-bold text-green-400 mb-10">
          Edit Profile
        </h2>

        {/* FLEX: AVATAR LEFT — FORM RIGHT */}
        <div className="flex flex-col md:flex-row gap-10">

          {/* AVATAR SECTION */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-green-400 rounded-full overflow-hidden shadow-xl 
                            flex items-center justify-center text-4xl font-bold text-black">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </div>

            <label className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 
                               rounded-lg cursor-pointer flex items-center gap-2 shadow-md">
              <Upload size={16} /> Upload
              <input type="file" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          {/* INPUT FORM */}
          <div className="flex-1 flex flex-col gap-6">

            <div>
              <label className="text-gray-300 text-sm">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1 p-3 bg-[#1B263B] border border-green-400 
                           rounded-lg text-white"
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm">Email</label>
              <input
                value={email}
                disabled
                className="w-full mt-1 p-3 bg-[#1B263B] border border-gray-500 
                           rounded-lg text-gray-400"
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 p-3 bg-[#1B263B] border border-green-400 
                           rounded-lg text-white"
              />
            </div>

          </div>
        </div>

        {/* FOOTER BUTTONS (BOTTOM LEFT + RIGHT) */}
        <div className="flex justify-between items-center mt-12">

          {/* BACK LEFT BOTTOM */}
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-2 text-green-400 hover:text-green-300"
          >
            <ArrowLeft size={18} /> Back to Chat
          </button>

          {/* SAVE BUTTON RIGHT BOTTOM */}
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold 
                       px-8 py-3 rounded-lg shadow-lg"
          >
            Save Changes
          </button>

        </div>
      </div>

    </div>
  );
}
