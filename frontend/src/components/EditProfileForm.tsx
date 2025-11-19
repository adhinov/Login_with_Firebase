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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Updated!");
      router.push("/chat");
    } catch (err) {
      alert("Failed to update");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#071422] flex justify-center items-center py-10 px-4">
      <div className="relative bg-[#0D1B2A] border border-gray-700 rounded-2xl shadow-xl 
                      w-full max-w-md p-6 sm:p-8">

        {/* TITLE LEFT TOP */}
        <h2 className="text-2xl font-bold text-green-400 mb-6">Edit Profile</h2>

        {/* AVATAR CENTER */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-green-400 rounded-full overflow-hidden flex items-center 
                          justify-center text-black text-3xl font-bold shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" />
            ) : (
              username.charAt(0).toUpperCase()
            )}
          </div>

          <label className="mt-3 bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg 
                             text-white flex items-center gap-2 cursor-pointer text-sm">
            <Upload size={15} /> Upload
            <input type="file" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        {/* FORM INPUTS */}
        <div className="flex flex-col gap-4">

          <div>
            <label className="text-gray-300 text-sm">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-lg bg-[#1B263B] border 
                         border-green-400 text-white text-sm"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm">Email</label>
            <input
              value={email}
              disabled
              className="w-full mt-1 p-2.5 rounded-lg bg-[#1B263B] border 
                         border-gray-500 text-gray-400 text-sm"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-lg bg-[#1B263B] border 
                         border-green-400 text-white text-sm"
            />
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex justify-between items-center mt-8">
          {/* BACK LEFT */}
          <button
            onClick={() => router.push("/chat")}
            className="text-gray-300 hover:text-gray-100 flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} /> Back to Chat
          </button>

          {/* SAVE RIGHT */}
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold 
                       px-5 py-2.5 rounded-lg shadow-lg text-sm"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
