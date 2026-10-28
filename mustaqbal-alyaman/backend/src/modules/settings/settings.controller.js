const { SchoolSetting, Term } = require('./settings.model');

// =================== SETTINGS ===================

const getSettings = async (req, res, next) => {
  try {
    let settings = await SchoolSetting.findOne({
      include: [{ model: Term, as: 'currentTerm' }],
    });

    if (!settings) {
      settings = await SchoolSetting.create({
        school_name: 'مدرسة مستقبل اليمن',
        phone: '+967-1-234567',
        email: 'info@mustaqbal-alyaman.edu.ye',
        address: 'صنعاء، اليمن',
        established_year: 2010,
      });
    }

    const terms = await Term.findAll({
      order: [['academic_year', 'DESC'], ['is_current', 'DESC'], ['name', 'ASC']],
    });

    res.json({ success: true, data: { settings, terms } });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    let settings = await SchoolSetting.findOne();
    if (!settings) {
      settings = await SchoolSetting.create(req.body);
    } else {
      await settings.update(req.body);
    }

    // إذا تم تحديد فصل حالي، تحديث جدول terms
    if (req.body.current_term_id) {
      await Term.update({ is_current: false }, { where: {} });
      await Term.update({ is_current: true }, { where: { id: req.body.current_term_id } });
    }

    const updated = await SchoolSetting.findByPk(settings.id, {
      include: [{ model: Term, as: 'currentTerm' }],
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// =================== TERMS ===================

const getTerms = async (req, res, next) => {
  try {
    const terms = await Term.findAll({
      order: [['academic_year', 'DESC'], ['is_current', 'DESC']],
    });
    res.json({ success: true, data: terms });
  } catch (err) { next(err); }
};

const createTerm = async (req, res, next) => {
  try {
    const { name, academic_year, is_current, start_date, end_date } = req.body;
    if (!name || !academic_year) {
      return res.status(400).json({ success: false, error: 'اسم الفصل والسنة الدراسية مطلوبان.' });
    }

    if (is_current) {
      await Term.update({ is_current: false }, { where: {} });
    }

    const term = await Term.create({
      name,
      academic_year,
      is_current: Boolean(is_current),
      start_date,
      end_date,
    });

    if (is_current) {
      await SchoolSetting.update({ current_term_id: term.id }, { where: {} });
    }

    res.status(201).json({ success: true, data: term });
  } catch (err) { next(err); }
};

const updateTerm = async (req, res, next) => {
  try {
    const term = await Term.findByPk(req.params.id);
    if (!term) return res.status(404).json({ success: false, error: 'الفصل الدراسي غير موجود.' });

    if (req.body.is_current) {
      await Term.update({ is_current: false }, { where: {} });
      await SchoolSetting.update({ current_term_id: term.id }, { where: {} });
    }

    await term.update(req.body);
    res.json({ success: true, data: term });
  } catch (err) { next(err); }
};

const setCurrentTerm = async (req, res, next) => {
  try {
    const term = await Term.findByPk(req.params.id);
    if (!term) return res.status(404).json({ success: false, error: 'الفصل الدراسي غير موجود.' });

    await Term.update({ is_current: false }, { where: {} });
    await term.update({ is_current: true });

    let settings = await SchoolSetting.findOne();
    if (settings) {
      await settings.update({ current_term_id: term.id });
    }

    res.json({ success: true, data: { message: `تم تفعيل "${term.name}" كفصل دراسي حالي.` } });
  } catch (err) { next(err); }
};

const deleteTerm = async (req, res, next) => {
  try {
    const term = await Term.findByPk(req.params.id);
    if (!term) return res.status(404).json({ success: false, error: 'الفصل الدراسي غير موجود.' });
    if (term.is_current) {
      return res.status(400).json({ success: false, error: 'لا يمكن حذف الفصل الدراسي النشط حالياً.' });
    }
    await term.destroy();
    res.json({ success: true, data: { message: 'تم حذف الفصل الدراسي بنجاح.' } });
  } catch (err) { next(err); }
};

module.exports = {
  getSettings,
  updateSettings,
  getTerms,
  createTerm,
  updateTerm,
  setCurrentTerm,
  deleteTerm,
};
