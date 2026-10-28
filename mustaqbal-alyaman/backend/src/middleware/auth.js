const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'غير مصرح. الرجاء تسجيل الدخول.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مجدداً.' });
    }
    return res.status(401).json({ success: false, error: 'رمز مصادقة غير صالح.' });
  }
};

module.exports = authMiddleware;
