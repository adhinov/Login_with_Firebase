import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "login-app/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 300, height: 300, crop: "fill" }],
  },
});

export const uploadAvatar = multer({ storage: avatarStorage });
