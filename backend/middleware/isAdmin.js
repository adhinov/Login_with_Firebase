// middleware/isAdmin.js
export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: Token tidak valid" });
    }

    // role dari JWT bisa berupa "admin" atau role_id = 1
    if (req.user.role !== "admin" && req.user.role_id !== 1) {
      return res.status(403).json({ message: "Akses khusus admin" });
    }

    next();
  } catch (err) {
    console.error("❌ Error isAdmin middleware:", err.message);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};
