const db = require('./src/config/db');
async function fix() {
  try {
    await db.query("UPDATE users SET name = 'المدير العام' WHERE email = 'admin@school.ye'");
    await db.query("UPDATE users SET name = 'أحمد محمد علي' WHERE email = 'ahmed.teacher@school.ye'");
    await db.query("UPDATE users SET name = 'فاطمة عبدالله' WHERE email = 'fatima.teacher@school.ye'");
    await db.query("UPDATE users SET name = 'محمد سالم' WHERE email = 'student1@school.ye'");
    await db.query("UPDATE users SET name = 'نور أحمد' WHERE email = 'student2@school.ye'");
    await db.query("UPDATE users SET name = 'عبدالله سالم' WHERE email = 'parent1@school.ye'");
    console.log('Fixed names');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
fix();
