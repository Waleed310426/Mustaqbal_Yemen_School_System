const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const { FeeStructure, Payment } = require('./payments.model');
const { Student } = require('../students-classes/students.model');
const User = require('../auth/user.model');

const getFeeStructures = async (req, res, next) => {
  try {
    const structures = await FeeStructure.findAll({ order: [['grade_level', 'ASC']] });
    res.json({ success: true, data: structures });
  } catch (err) { next(err); }
};

const createFeeStructure = async (req, res, next) => {
  try {
    const fee = await FeeStructure.create(req.body);
    res.status(201).json({ success: true, data: fee });
  } catch (err) { next(err); }
};

const updateFeeStructure = async (req, res, next) => {
  try {
    const fee = await FeeStructure.findByPk(req.params.id);
    if (!fee) return res.status(404).json({ success: false, error: 'هيكل الرسوم غير موجود.' });
    await fee.update(req.body);
    res.json({ success: true, data: fee });
  } catch (err) { next(err); }
};

const getPayments = async (req, res, next) => {
  try {
    let { student_id, status } = req.query;
    const where = {};

    if (req.user.role === 'student') {
      const studentRec = await Student.findOne({ where: { user_id: req.user.id } });
      if (studentRec) where.student_id = studentRec.id;
    } else if (req.user.role === 'parent') {
      const { Parent, StudentParent } = require('../students-classes/students.model');
      const parent = await Parent.findOne({ where: { user_id: req.user.id } });
      if (parent) {
        const sps = await StudentParent.findAll({ where: { parent_id: parent.id } });
        where.student_id = { [Op.in]: sps.map(sp => sp.student_id) };
      }
    } else if (student_id) {
      where.student_id = student_id;
    }

    if (status) where.status = status;

    const payments = await Payment.findAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name'] }] },
        { model: FeeStructure, as: 'feeStructure', required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
};

const createPayment = async (req, res, next) => {
  try {
    const { student_id, fee_structure_id, amount, due_date, paid_date, status, payment_method, notes } = req.body;
    if (!student_id || !amount) return res.status(400).json({ success: false, error: 'الطالب والمبلغ مطلوبان.' });

    const payment = await Payment.create({
      student_id, fee_structure_id, amount, due_date,
      paid_date: paid_date || new Date(),
      status: status || 'paid',
      payment_method: payment_method || 'cash',
      notes,
      recorded_by: req.user.id,
    });

    // توليد إيصال PDF
    const fileName = `receipt_${payment.id}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../../../uploads', fileName);
    const doc = new PDFDocument({ size: 'A5' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fillColor('#1e40af').fontSize(20).text('مدرسة مستقبل اليمن', { align: 'center' }).moveDown(0.5);
    doc.fillColor('#111827').fontSize(14).text('إيصال دفع', { align: 'center' }).moveDown(1);
    doc.fontSize(12).text(`رقم الإيصال: ${payment.id}`).moveDown(0.3);
    doc.text(`المبلغ: ${amount} ريال يمني`).moveDown(0.3);
    doc.text(`طريقة الدفع: ${payment_method || 'نقداً'}`).moveDown(0.3);
    doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-YE')}`).moveDown(1);
    doc.fillColor('#16a34a').fontSize(14).text('تم الدفع بنجاح ✓', { align: 'center' });
    doc.end();

    await new Promise(resolve => stream.on('finish', resolve));
    await payment.update({ receipt_url: `/uploads/${fileName}` });

    res.status(201).json({ success: true, data: payment });
  } catch (err) { next(err); }
};

const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, error: 'الدفعة غير موجودة.' });
    await payment.update(req.body);
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
};

const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, error: 'الدفعة غير موجودة.' });
    await payment.destroy();
    res.json({ success: true, data: { message: 'تم حذف الدفعة.' } });
  } catch (err) { next(err); }
};

/**
 * GET /api/payments/report — تقرير مالي
 */
const getFinancialReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from && to) where.created_at = { [Op.between]: [new Date(from), new Date(to)] };

    const payments = await Payment.findAll({ where });

    const totalCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'partial').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.json({
      success: true, data: {
        totalCollected, totalPending, totalOverdue,
        totalRevenue: totalCollected,
        count: { paid: payments.filter(p => p.status === 'paid').length, pending: payments.filter(p => p.status === 'pending').length, overdue: payments.filter(p => p.status === 'overdue').length },
      },
    });
  } catch (err) { next(err); }
};

module.exports = { getFeeStructures, createFeeStructure, updateFeeStructure, getPayments, createPayment, updatePayment, deletePayment, getFinancialReport };
