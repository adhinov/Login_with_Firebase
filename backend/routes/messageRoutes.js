import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];

    if (!authHeader)
      return res
        .status(401)
        .json({ success: false, message: "Authorization header tidak ditemukan" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
      return res.status(400).json({
        success: false,
        message: "Format Authorization header tidak valid (harus 'Bearer <token>')",
      });

    const token = parts[1];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Token tidak ditemukan" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token sudah kadaluarsa, silakan login ulang" });
    }

    return res
      .status(403)
      .json({ success: false, message: "Token tidak valid" });
  }
};

export default router;

