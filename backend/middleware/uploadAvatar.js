// middleware/uploadAvatar.js
import multer from "multer";
import path from "path";
import fs from "fs";

const avatarsDir = path.join(process.cwd(), "uploads", "avatars");

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log("📁 Folder created:", avatarsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpg|jpeg|png|webp|svg)$/;
  const allowedMime = /(image\/jpeg|image\/jpg|image\/png|image\/webp|image\/svg\+xml)/;

  const extValid = allowedExt.test(file.originalname.toLowerCase());
  const mimeValid = allowedMime.test(file.mimetype);

  if (extValid && mimeValid) cb(null, true);
  else cb(new Error("Invalid file type. Only image files allowed."), false);
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
