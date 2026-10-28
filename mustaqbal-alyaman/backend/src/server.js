require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const sequelize = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./sockets/socket');
const setupAssociations = require('./db/associations');

// إعداد العلاقات بين الجداول
setupAssociations();

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const studentsRoutes = require('./modules/students-classes/students.routes');
const teachersRoutes = require('./modules/teachers-subjects-schedule/teachers.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const gradesRoutes = require('./modules/grades-certificates/grades.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const dashboardRoutes = require('./modules/dashboard-notifications/dashboard.routes');
const transportationRoutes = require('./modules/transportation/transportation.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const activitiesRoutes = require('./modules/activities/activities.routes');
const examsRoutes = require('./modules/exams/exams.routes');
const settingsRoutes = require('./modules/settings/settings.routes');

// Controllers needing io injection
const { setIo: setAttendanceIo } = require('./modules/attendance/attendance.controller');
const { setIo: setDashboardIo } = require('./modules/dashboard-notifications/dashboard.controller');

// ========================
// إعداد التطبيق
// ========================
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// حقن io في الـ controllers
setAttendanceIo(io);
setDashboardIo(io);
setupSocket(io);

// ========================
// Middleware
// ========================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات المرفوعة (شهادات، إيصالات)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api', studentsRoutes);
app.use('/api', teachersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transportation', transportationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'OK', message: 'نظام مدرسة مستقبل اليمن يعمل بشكل صحيح ✓' } });
});

// ========================
// معالج الأخطاء المركزي
// ========================
app.use(errorHandler);

// ========================
// تشغيل الخادم
// ========================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // مزامنة الـ Models (في بيئة التطوير فقط)
    if (process.env.NODE_ENV === 'development') {
      // لا نستخدم sync({ force: true }) - يجب تشغيل schema.sql يدوياً
      await sequelize.sync({ alter: false });
      console.log('✅ تمت مزامنة Models مع قاعدة البيانات');
    }

    server.listen(PORT, () => {
      console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
      console.log(`📡 Socket.io جاهز للاتصالات الفورية`);
      console.log(`🌐 رابط الـ API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ فشل تشغيل الخادم:', error.message);
    process.exit(1);
  }
};

startServer();
