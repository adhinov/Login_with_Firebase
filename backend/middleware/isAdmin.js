export const isAdmin = (req, res, next) => {
  if (req.user.role_id !== 1) {
    return res.status(403).json({ message: "Akses khusus admin" });
  }
  next();
};
