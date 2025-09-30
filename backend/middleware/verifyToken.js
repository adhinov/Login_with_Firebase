// middleware/verifyToken.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header tidak ditemukan" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // simpan payload JWT (id, role, dll.)
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token sudah kadaluarsa" });
    }

    return res.status(403).json({ message: "Token tidak valid" });
  }
};
