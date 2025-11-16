"use client";

import React, { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";

export default function EditProfile() {
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [avatar, setAvatar] = useState(user.avatar || "");

  const previewAvatar = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 flex justify-center items-center px-4">
      <div className="bg-gray-850 w-full max-w-3xl rounded-2xl shadow-xl p-6 border border-gray-700">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => history.back()} className="text-green-400 hover:text-green-300">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-green-400 font-bold text-xl">User Profile</h1>
        </div>

        {/* MAIN */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">

          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-full bg-green-400 flex items-center justify-center text-5xl font-bold overflow-hidden">
              {avatar ? (
                <img src={avatar} className="w-full h-full object-cover" />
              ) : (
                (username || email || "U")[0].toUpperCase()
              )}
            </div>

            <label className="mt-3 px-4 py-2 bg-gray-700 text-white rounded-lg cursor-pointer hover:bg-gray-600 flex items-center gap-2">
              <Upload size={18} />
              Upload
              <input type="file" className="hidden" accept="image/*" onChange={previewAvatar} />
            </label>
          </div>

          {/* FORM */}
          <div className="flex-1 w-full space-y-4">

            <div>
              <label className="text-gray-400 text-sm">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-gray-800 rounded-xl text-white outline-none border border-gray-700"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <input
                value={email}
                readOnly
                className="w-full mt-1 px-3 py-2 bg-gray-800 rounded-xl text-white outline-none border border-gray-700 opacity-70"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-gray-800 rounded-xl text-white outline-none border border-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="px-6 py-2 bg-green-400 hover:bg-green-300 text-gray-900 font-semibold rounded-xl">
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
