/**
 * Middleware للتحقق من صلاحية الدور (RBAC)
 * Deny by Default - ممنوع ما لم يُذكر صراحة
 */
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'غير مصرح.' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'ليس لديك صلاحية للوصول إلى هذا المورد.',
      });
    }

    next();
  };
};

module.exports = requireRole;
