// middleware/authorizeRole.js

export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({
          success: false,
          message: "Role tidak ditemukan dalam token",
        });
      }

      // allowedRoles bisa berupa array (["admin", "superadmin"])
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak, role tidak sesuai",
        });
      }

      next(); // lolos -> lanjut ke controller
    } catch (error) {
      console.error("❌ Role authorization error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat otorisasi role",
      });
    }
  };
};
