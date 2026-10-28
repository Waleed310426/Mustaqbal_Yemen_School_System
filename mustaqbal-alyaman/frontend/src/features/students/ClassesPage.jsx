import { useEffect, useState } from 'react';
import Layout from '../../shared/components/Layout';
import apiClient from '../../shared/apiClient';

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ grade_level: '', section: '', capacity: 40 });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = async () => {
    try {
      const res = await apiClient.get('/classes');
      setClasses(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 3000); };

  const openAdd = () => {
    setEditingId(null);
    setForm({ grade_level: '', section: '', capacity: 40 });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      grade_level: c.grade_level || '',
      section: c.section || '',
      capacity: c.capacity || 40,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/classes/${editingId}`, form);
        showAlert('success', 'تم تعديل بيانات الفصل بنجاح');
      } else {
        await apiClient.post('/classes', form);
        showAlert('success', 'تم إضافة الفصل بنجاح');
      }
      setShowModal(false);
      setEditingId(null);
      load();
    } catch (err) { showAlert('danger', err.response?.data?.error || 'حدث خطأ'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا الفصل؟ سيتم حذف بيانات ارتباط الطلاب به!')) return;
    try { await apiClient.delete(`/classes/${id}`); showAlert('success', 'تم الحذف'); load(); }
    catch { showAlert('danger', 'حدث خطأ'); }
  };

  return (
    <Layout title="إدارة الفصول">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '❌'} {alert.msg}</div>}
      <div className="page-header">
        <div><h1>الفصول الدراسية</h1><p>إجمالي {classes.length} فصل</p></div>
        <button id="add-class-btn" className="btn btn-primary" onClick={openAdd}>+ إضافة فصل</button>
      </div>
      <div className="card">
        {loading ? <div className="loading-screen"><div className="spinner" /></div>
          : classes.length === 0 ? <div className="empty-state"><div className="icon">🏫</div><h3>لا يوجد فصول</h3></div>
          : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>#</th><th>الصف الدراسي</th><th>الشعبة</th><th>السعة الاستيعابية</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {classes.map((c, i) => (
                    <tr key={c.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td><strong>{c.grade_level}</strong></td>
                      <td>{c.section}</td>
                      <td>{c.capacity} طالب</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button id={`edit-class-${c.id}`} className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="تعديل">✏️</button>
                          <button id={`delete-class-${c.id}`} className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)} title="حذف">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId ? 'تعديل بيانات الفصل' : 'إضافة فصل جديد'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">الصف الدراسي (مثال: الأول، الثاني) *</label><input className="form-control" required value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">الشعبة (مثال: أ، ب) *</label><input className="form-control" required value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">السعة الاستيعابية</label><input type="number" className="form-control" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳...' : (editingId ? '💾 حفظ التعديلات' : '💾 حفظ')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ClassesPage;
