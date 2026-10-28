import { useState, useEffect } from 'react';
import Layout from '../../shared/components/Layout';
import api from '../../shared/apiClient';
import { useAuth } from '../../context/AuthContext';

const examTypeMap = { monthly: 'شهري', midterm: 'نصف فصل', final: 'نهائي' };

export default function ExamsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const [tab, setTab] = useState('schedule');
  const [halls, setHalls] = useState([]);
  const [seats, setSeats] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [genForm, setGenForm] = useState({ term_id: '', class_id: '', prefix: 'S', start_from: 1 });
  const [filterTermId, setFilterTermId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTermId) params.term_id = filterTermId;
      if (filterClassId) params.class_id = filterClassId;

      const [h, s, e] = await Promise.all([
        api.get('/exams/halls'),
        api.get('/exams/seats', { params }),
        api.get('/exams/schedule', { params }),
      ]);
      setHalls(h.data.data);
      setSeats(s.data.data);
      setExams(e.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterTermId, filterClassId]);

  const openModal = (type, data = {}) => { setModal(type); setForm(data); };
  const closeModal = () => { setModal(null); setForm({}); };

  const saveHall = async () => {
    try {
      if (form.id) await api.put(`/exams/halls/${form.id}`, form);
      else await api.post('/exams/halls', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.error || 'خطأ'); }
  };

  const saveExam = async () => {
    try {
      if (form.id) await api.put(`/exams/schedule/${form.id}`, form);
      else await api.post('/exams/schedule', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.error || 'خطأ'); }
  };

  const generateSeats = async () => {
    try {
      await api.post('/exams/seats/generate', genForm);
      load(); closeModal();
      alert('تم توليد أرقام الجلوس بنجاح!');
    } catch (e) { alert(e.response?.data?.error || 'خطأ'); }
  };

  const deleteExam = async (id) => {
    if (!confirm('حذف هذا الامتحان؟')) return;
    await api.delete(`/exams/schedule/${id}`); load();
  };

  const deleteHall = async (id) => {
    if (!confirm('حذف هذه القاعة؟')) return;
    await api.delete(`/exams/halls/${id}`); load();
  };

  // كشف مناداة
  const printAttendanceSheet = async () => {
    if (!filterTermId || !filterClassId) {
      alert('يرجى تحديد الفترة والفصل أولاً');
      return;
    }
    try {
      const res = await api.get('/exams/attendance-sheet', {
        params: { term_id: filterTermId, class_id: filterClassId }
      });
      setModal('sheet');
      setForm({ sheet: res.data.data });
    } catch (e) { alert('خطأ في تحميل كشف المناداة'); }
  };

  return (
    <Layout title="الكنترول والامتحانات">
      {/* فلتر */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          type="number"
          className="form-control"
          style={{ width: 160 }}
          placeholder="رقم الفترة الدراسية"
          value={filterTermId}
          onChange={e => setFilterTermId(e.target.value)}
        />
        <input
          type="number"
          className="form-control"
          style={{ width: 160 }}
          placeholder="رقم الفصل"
          value={filterClassId}
          onChange={e => setFilterClassId(e.target.value)}
        />
        {(isAdmin || isTeacher) && (
          <button className="btn btn-outline btn-sm" onClick={printAttendanceSheet}>
            📋 كشف المناداة
          </button>
        )}
        <div style={{ flex: 1 }} />
        {tab === 'halls' && isAdmin && (
          <button className="btn btn-primary" onClick={() => openModal('hall')}>+ إضافة قاعة</button>
        )}
        {tab === 'seats' && isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal('generate')}>⚙️ توليد أرقام جلوس</button>
        )}
        {tab === 'schedule' && isAdmin && (
          <button className="btn btn-primary" onClick={() => openModal('exam')}>+ إضافة امتحان</button>
        )}
      </div>

      <div className="card">
        {/* Tabs */}
        <div className="card-header" style={{ gap: 0, padding: '0 24px' }}>
          {[
            { key: 'schedule', label: '📅 جدول الامتحانات' },
            { key: 'seats', label: '🪑 أرقام الجلوس' },
            { key: 'halls', label: '🏛️ قاعات الامتحانات' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '18px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif', fontSize: 14,
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--primary)' : 'var(--gray-500)',
              borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>جارٍ التحميل...</div>
          ) : (
            <>
              {/* جدول الامتحانات */}
              {tab === 'schedule' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>المادة</th>
                        <th>الفصل</th>
                        <th>نوع الامتحان</th>
                        <th>التاريخ</th>
                        <th>من</th>
                        <th>إلى</th>
                        <th>القاعة</th>
                        <th>ملاحظات</th>
                        {isAdmin && <th>إجراءات</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {exams.length === 0 ? (
                        <tr><td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                          لا توجد امتحانات مجدولة
                        </td></tr>
                      ) : exams.map(e => (
                        <tr key={e.id}>
                          <td>مادة #{e.subject_id}</td>
                          <td>فصل #{e.class_id}</td>
                          <td>
                            <span className={`badge ${
                              e.exam_type === 'final' ? 'badge-red' :
                              e.exam_type === 'midterm' ? 'badge-orange' : 'badge-blue'
                            }`}>{examTypeMap[e.exam_type]}</span>
                          </td>
                          <td><strong>{e.exam_date}</strong></td>
                          <td>{e.start_time || '—'}</td>
                          <td>{e.end_time || '—'}</td>
                          <td>{e.hall?.name || '—'}</td>
                          <td>{e.notes || '—'}</td>
                          {isAdmin && (
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => openModal('exam', e)}>✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteExam(e.id)}>🗑️</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* أرقام الجلوس */}
              {tab === 'seats' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>رقم الجلوس</th>
                        <th>الرقم السري</th>
                        <th>رقم الطالب</th>
                        <th>القاعة</th>
                        <th>الفترة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seats.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                          لا توجد أرقام جلوس — استخدم "توليد أرقام جلوس"
                        </td></tr>
                      ) : seats.map(s => (
                        <tr key={s.id}>
                          <td><strong style={{ fontSize: 16, color: 'var(--primary)' }}>{s.seat_number}</strong></td>
                          <td><code style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 4 }}>{s.secret_number || '—'}</code></td>
                          <td>#{s.student_id}</td>
                          <td>{s.hall?.name || '—'}</td>
                          <td>{s.term_id || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* القاعات */}
              {tab === 'halls' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>اسم القاعة</th>
                        <th>السعة</th>
                        <th>المبنى</th>
                        <th>الطابق</th>
                        {isAdmin && <th>إجراءات</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {halls.length === 0 ? (
                        <tr><td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                          لا توجد قاعات
                        </td></tr>
                      ) : halls.map(h => (
                        <tr key={h.id}>
                          <td><strong>{h.name}</strong></td>
                          <td>{h.capacity} طالب</td>
                          <td>{h.building || '—'}</td>
                          <td>{h.floor_number}</td>
                          {isAdmin && (
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => openModal('hall', h)}>✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteHall(h.id)}>🗑️</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal قاعة */}
      {modal === 'hall' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'تعديل قاعة' : 'إضافة قاعة جديدة'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">اسم القاعة *</label>
                  <input className="form-control" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">السعة</label>
                  <input type="number" className="form-control" value={form.capacity || 30} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">المبنى</label>
                  <input className="form-control" value={form.building || ''} onChange={e => setForm({ ...form, building: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">الطابق</label>
                  <input type="number" className="form-control" value={form.floor_number || 1} onChange={e => setForm({ ...form, floor_number: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveHall}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal امتحان */}
      {modal === 'exam' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'تعديل امتحان' : 'جدولة امتحان جديد'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">رقم المادة *</label>
                  <input type="number" className="form-control" value={form.subject_id || ''} onChange={e => setForm({ ...form, subject_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الفصل *</label>
                  <input type="number" className="form-control" value={form.class_id || ''} onChange={e => setForm({ ...form, class_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع الامتحان *</label>
                  <select className="form-control" value={form.exam_type || 'monthly'} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                    <option value="monthly">شهري</option>
                    <option value="midterm">نصف فصل</option>
                    <option value="final">نهائي</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">القاعة</label>
                  <select className="form-control" value={form.hall_id || ''} onChange={e => setForm({ ...form, hall_id: e.target.value })}>
                    <option value="">— اختر —</option>
                    {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ الامتحان *</label>
                  <input type="date" className="form-control" value={form.exam_date || ''} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الفترة الدراسية</label>
                  <input type="number" className="form-control" value={form.term_id || ''} onChange={e => setForm({ ...form, term_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">وقت البداية</label>
                  <input type="time" className="form-control" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">وقت الانتهاء</label>
                  <input type="time" className="form-control" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">ملاحظات</label>
                  <textarea className="form-control" rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveExam}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal توليد أرقام جلوس */}
      {modal === 'generate' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ توليد أرقام جلوس تلقائياً</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--primary-dark)' }}>
                💡 سيتم توليد أرقام جلوس تلقائية لجميع طلاب الفصل المحدد مع توزيعهم على القاعات المتاحة
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">رقم الفترة الدراسية *</label>
                  <input type="number" className="form-control" value={genForm.term_id}
                    onChange={e => setGenForm({ ...genForm, term_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الفصل *</label>
                  <input type="number" className="form-control" value={genForm.class_id}
                    onChange={e => setGenForm({ ...genForm, class_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">بادئة الرقم</label>
                  <input className="form-control" maxLength={3} value={genForm.prefix}
                    onChange={e => setGenForm({ ...genForm, prefix: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">يبدأ من</label>
                  <input type="number" min={1} className="form-control" value={genForm.start_from}
                    onChange={e => setGenForm({ ...genForm, start_from: e.target.value })} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
                مثال: البادئة "S" والبدء من 1 = S0001, S0002, S0003...
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>إلغاء</button>
              <button className="btn btn-primary" onClick={generateSeats}>⚙️ توليد الأرقام</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal كشف المناداة */}
      {modal === 'sheet' && form.sheet && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 كشف المناداة</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => window.print()}>🖨️ طباعة</button>
                <button className="modal-close" onClick={closeModal}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم الطالب</th>
                      <th>رقم الجلوس</th>
                      <th>الرقم السري</th>
                      <th>القاعة</th>
                      <th>التوقيع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.sheet.map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{row.student_name}</td>
                        <td><strong>{row.seat_number}</strong></td>
                        <td><code>{row.secret_number}</code></td>
                        <td>{row.hall_name || '—'}</td>
                        <td style={{ width: 100 }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
