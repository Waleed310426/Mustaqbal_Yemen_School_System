const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./user.model');

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'تم تعطيل هذا الحساب. تواصل مع الإدارة.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود.' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'كلمة المرور الحالية والجديدة مطلوبتان.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.' });
    }

    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'كلمة المرور الحالية غير صحيحة.' });
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({ success: true, data: { message: 'تم تغيير كلمة المرور بنجاح.' } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password (Admin only)
 */
const resetPassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, error: 'معرف المستخدم وكلمة المرور الجديدة مطلوبان.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود.' });
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({ success: true, data: { message: 'تم إعادة تعيين كلمة المرور بنجاح.' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, changePassword, resetPassword };
