const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
  console.error(err.stack);

  // أخطاء Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'خطأ في التحقق من البيانات.',
      details: err.errors.map((e) => e.message),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'البيانات موجودة بالفعل. يرجى التحقق من البيانات المكررة.',
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: 'خطأ في العلاقات بين البيانات.',
    });
  }

  // أخطاء عامة
  const statusCode = err.statusCode || 500;
  const message = err.message || 'حدث خطأ داخلي في الخادم.';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = errorHandler;
