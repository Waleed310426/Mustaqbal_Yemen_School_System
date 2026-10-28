import { useState, useEffect } from 'react';
import Layout from '../../shared/components/Layout';
import api from '../../shared/apiClient';

const statusColors = {
  upcoming: { label: 'قادم', cls: 'badge-blue' },
  ongoing: { label: 'جارٍ', cls: 'badge-green' },
  completed: { label: 'منتهي', cls: 'badge-gray' },
  cancelled: { label: 'ملغي', cls: 'badge-red' },
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantStudentId, setParticipantStudentId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const [acts, typs] = await Promise.all([
        api.get('/activities', { params }),
        api.get('/activities/types'),
      ]);
      setActivities(acts.data.data);
      setTypes(typs.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const loadParticipants = async (activity) => {
    setSelectedActivity(activity);
    const res = await api.get(`/activities/${activity.id}/participants`);
    setParticipants(res.data.data);
    setModal('participants');
  };

  const addParticipant = async () => {
    try {
      await api.post(`/activities/${selectedActivity.id}/participants`, { student_id: participantStudentId });
      const res = await api.get(`/activities/${selectedActivity.id}/participants`);
      setParticipants(res.data.data);
      setParticipantStudentId('');
    } catch (e) { alert(e.response?.data?.message || 'خطأ'); }
  };

  const updateParticipantStatus = async (pid, status) => {
    await api.put(`/activities/participants/${pid}`, { status });
    const res = await api.get(`/activities/${selectedActivity.id}/participants`);
    setParticipants(res.data.data);
  };

  const openModal = (type, data = {}) => { setModal(type); setForm(data); };
  const closeModal = () => { setModal(null); setForm({}); setSelectedActivity(null); };

  const saveActivity = async () => {
    try {
      if (form.id) await api.put(`/activities/${form.id}`, form);
      else await api.post('/activities', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.message || 'خطأ'); }
  };

  const deleteActivity = async (id) => {
    if (!window.confirm('هل تريد حذف هذا النشاط؟')) return;
    try {
      await api.delete(`/activities/${id}`);
      load();
    } catch (e) { alert(e.response?.data?.error || 'خطأ أثناء الحذف'); }
  };

  const saveType = async () => {
    try {
      await api.post('/activities/types', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.message || 'خطأ'); }
  };

  return (
    <Layout title="الأنشطة الطلابية">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <select className="form-control" style={{ width: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">كل الأنشطة</option>
          <option value="upcoming">القادمة</option>
          <option value="ongoing">الجارية</option>
          <option value="completed">المنتهية</option>
          <option value="cancelled">الملغاة</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => openModal('type')}>+ نوع نشاط</button>
        <button className="btn btn-primary" onClick={() => openModal('activity')}>+ إضافة نشاط</button>
      </div>

      {/* أنواع الأنشطة */}
      {types.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {types.map(t => (
            <span key={t.id} style={{
              padding: '4px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: t.color + '22', color: t.color, border: `1px solid ${t.color}44`,
            }}>{t.name}</span>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>جارٍ التحميل...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {activities.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>
              <div style={{ fontSize: 48 }}>🎯</div>
              <p style={{ marginTop: 12 }}>لا توجد أنشطة</p>
            </div>
          ) : activities.map(a => (
            <div key={a.id} className="card" style={{ overflow: 'hidden' }}>
              <div style={{
                height: 6,
                background: a.type?.color || 'var(--primary)',
              }} />
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className={`badge ${statusColors[a.status]?.cls}`}>{statusColors[a.status]?.label}</span>
                  {a.type && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 100,
                      background: a.type.color + '22', color: a.type.color,
                    }}>{a.type.name}</span>
                  )}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{a.title}</h3>
                {a.description && <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>{a.description}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>
                  <div>📅 {new Date(a.start_date).toLocaleDateString('ar-YE')}</div>
                  {a.location && <div>📍 {a.location}</div>}
                  <div>👥 {a.participants_count || 0} {a.max_participants > 0 ? `/ ${a.max_participants}` : ''} مشارك</div>
                  {a.fee > 0 && <div>💰 {Number(a.fee).toLocaleString()} ريال</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => loadParticipants(a)}>
                    👥 المشاركون
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openModal('activity', a)} title="تعديل">✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteActivity(a.id)} title="حذف">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal نشاط */}
      {modal === 'activity' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'تعديل نشاط' : 'إضافة نشاط جديد'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">عنوان النشاط *</label>
                  <input className="form-control" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع النشاط</label>
                  <select className="form-control" value={form.type_id || ''} onChange={e => setForm({ ...form, type_id: e.target.value })}>
                    <option value="">— اختر —</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المكان</label>
                  <input className="form-control" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ البداية *</label>
                  <input type="datetime-local" className="form-control" value={form.start_date?.slice(0, 16) || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ النهاية</label>
                  <input type="datetime-local" className="form-control" value={form.end_date?.slice(0, 16) || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">الحد الأقصى للمشاركين (0 = غير محدود)</label>
                  <input type="number" min="0" className="form-control" value={form.max_participants || 0} onChange={e => setForm({ ...form, max_participants: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">رسوم المشاركة (ريال)</label>
                  <input type="number" min="0" className="form-control" value={form.fee || 0} onChange={e => setForm({ ...form, fee: e.target.value })} />
                </div>
                {form.id && (
                  <div className="form-group">
                    <label className="form-label">الحالة</label>
                    <select className="form-control" value={form.status || 'upcoming'} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="upcoming">قادم</option>
                      <option value="ongoing">جارٍ</option>
                      <option value="completed">منتهٍ</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">وصف النشاط</label>
                  <textarea className="form-control" rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveActivity}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal نوع النشاط */}
      {modal === 'type' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة نوع نشاط</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">اسم النوع *</label>
                <input className="form-control" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">اللون</label>
                <input type="color" style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--gray-200)', cursor: 'pointer' }}
                  value={form.color || '#3b82f6'} onChange={e => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveType}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal المشاركون */}
      {modal === 'participants' && selectedActivity && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>مشاركو: {selectedActivity.title}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="رقم الطالب"
                  value={participantStudentId}
                  onChange={e => setParticipantStudentId(e.target.value)}
                />
                <button className="btn btn-primary" onClick={addParticipant}>+ إضافة</button>
              </div>
              {participants.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 20 }}>لا يوجد مشاركون بعد</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>رقم الطالب</th>
                        <th>تاريخ التسجيل</th>
                        <th>الحالة</th>
                        <th>تغيير</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map(p => (
                        <tr key={p.id}>
                          <td>#{p.student_id}</td>
                          <td>{new Date(p.registration_date).toLocaleDateString('ar-YE')}</td>
                          <td>
                            <span className={`badge ${
                              p.status === 'attended' ? 'badge-green' :
                              p.status === 'absent' ? 'badge-red' :
                              p.status === 'cancelled' ? 'badge-gray' : 'badge-blue'
                            }`}>
                              {{ registered: 'مسجل', attended: 'حضر', absent: 'غاب', cancelled: 'ملغي' }[p.status]}
                            </span>
                          </td>
                          <td>
                            <select className="form-control" style={{ fontSize: 12, padding: '4px 8px' }}
                              value={p.status} onChange={e => updateParticipantStatus(p.id, e.target.value)}>
                              <option value="registered">مسجل</option>
                              <option value="attended">حضر</option>
                              <option value="absent">غاب</option>
                              <option value="cancelled">ملغي</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
