// middleware/uploadAvatar.js
import multer from "multer";
import path from "path";
import fs from "fs";

// buat folder temporary lokal untuk upload
const tempDir = "tmp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const uploadAvatar = multer({ storage });

export default uploadAvatar;
