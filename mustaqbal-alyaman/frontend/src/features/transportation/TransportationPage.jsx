import { useState, useEffect } from 'react';
import Layout from '../../shared/components/Layout';
import api from '../../shared/apiClient';

const statusMap = {
  active: { label: 'نشط', cls: 'badge-green' },
  maintenance: { label: 'في الصيانة', cls: 'badge-orange' },
  inactive: { label: 'متوقف', cls: 'badge-gray' },
};
const subStatusMap = {
  active: { label: 'نشط', cls: 'badge-green' },
  expired: { label: 'منتهي', cls: 'badge-red' },
  cancelled: { label: 'ملغي', cls: 'badge-gray' },
};
const subTypeMap = { daily: 'يومي', monthly: 'شهري', yearly: 'سنوي' };

export default function TransportationPage() {
  const [tab, setTab] = useState('routes');
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'route'|'bus'|'sub', data?: {} }
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [r, b, s, st] = await Promise.all([
        api.get('/transportation/routes'),
        api.get('/transportation/buses'),
        api.get('/transportation/subscriptions'),
        api.get('/transportation/stats'),
      ]);
      setRoutes(r.data.data);
      setBuses(b.data.data);
      setSubscriptions(s.data.data);
      setStats(st.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openModal = (type, data = {}) => { setModal(type); setForm(data); };
  const closeModal = () => { setModal(null); setForm({}); };

  const saveRoute = async () => {
    try {
      if (form.id) await api.put(`/transportation/routes/${form.id}`, form);
      else await api.post('/transportation/routes', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.message || 'حدث خطأ'); }
  };

  const saveBus = async () => {
    try {
      if (form.id) await api.put(`/transportation/buses/${form.id}`, form);
      else await api.post('/transportation/buses', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.message || 'حدث خطأ'); }
  };

  const saveSub = async () => {
    try {
      if (form.id) await api.put(`/transportation/subscriptions/${form.id}`, form);
      else await api.post('/transportation/subscriptions', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.message || 'حدث خطأ'); }
  };

  const deleteRoute = async (id) => {
    if (!confirm('هل تريد حذف خط السير هذا؟')) return;
    await api.delete(`/transportation/routes/${id}`); load();
  };
  const deleteBus = async (id) => {
    if (!confirm('هل تريد حذف هذه الحافلة؟')) return;
    await api.delete(`/transportation/buses/${id}`); load();
  };

  return (
    <Layout title="إدارة المواصلات">
      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 28 }}>
          <div className="stat-card blue">
            <div className="stat-icon">🗺️</div>
            <div className="stat-value">{stats.totalRoutes}</div>
            <div className="stat-label">خطوط سير نشطة</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">🚌</div>
            <div className="stat-value">{stats.totalBuses}</div>
            <div className="stat-label">حافلات تعمل</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.activeSubscriptions}</div>
            <div className="stat-label">اشتراك نشط</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{Number(stats.monthlyRevenue).toLocaleString()}</div>
            <div className="stat-label">إيرادات المواصلات (ريال)</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="card-header" style={{ gap: 0, padding: '0 24px' }}>
          {[
            { key: 'routes', label: '🗺️ خطوط السير' },
            { key: 'buses', label: '🚌 الحافلات' },
            { key: 'subscriptions', label: '📋 الاشتراكات' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '18px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                fontSize: 14,
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? 'var(--primary)' : 'var(--gray-500)',
                borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >{t.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => openModal(tab === 'routes' ? 'route' : tab === 'buses' ? 'bus' : 'sub')}
          >
            + إضافة {tab === 'routes' ? 'خط سير' : tab === 'buses' ? 'حافلة' : 'اشتراك'}
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>جارٍ التحميل...</div>
          ) : (
            <>
              {/* خطوط السير */}
              {tab === 'routes' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>اسم الخط</th>
                        <th>من</th>
                        <th>إلى</th>
                        <th>المسافة</th>
                        <th>رسوم شهرية</th>
                        <th>رسوم سنوية</th>
                        <th>الحافلات</th>
                        <th>الحالة</th>
                        <th>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routes.length === 0 ? (
                        <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>لا توجد خطوط سير</td></tr>
                      ) : routes.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.name}</strong></td>
                          <td>{r.start_point || '—'}</td>
                          <td>{r.end_point || '—'}</td>
                          <td>{r.distance_km ? `${r.distance_km} كم` : '—'}</td>
                          <td>{Number(r.monthly_fee).toLocaleString()} ريال</td>
                          <td>{Number(r.yearly_fee).toLocaleString()} ريال</td>
                          <td><span className="badge badge-blue">{r.buses?.length || 0} حافلة</span></td>
                          <td>
                            <span className={`badge ${r.is_active ? 'badge-green' : 'badge-gray'}`}>
                              {r.is_active ? 'نشط' : 'متوقف'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openModal('route', r)}>✏️</button>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteRoute(r.id)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* الحافلات */}
              {tab === 'buses' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>رقم الحافلة</th>
                        <th>رقم اللوحة</th>
                        <th>السائق</th>
                        <th>هاتف السائق</th>
                        <th>الطاقة</th>
                        <th>خط السير</th>
                        <th>الحالة</th>
                        <th>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buses.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>لا توجد حافلات</td></tr>
                      ) : buses.map(b => (
                        <tr key={b.id}>
                          <td><strong>{b.bus_number}</strong></td>
                          <td>{b.plate_number || '—'}</td>
                          <td>{b.driver_name || '—'}</td>
                          <td>{b.driver_phone || '—'}</td>
                          <td>{b.capacity} طالب</td>
                          <td>{b.route?.name || '—'}</td>
                          <td><span className={`badge ${statusMap[b.status]?.cls}`}>{statusMap[b.status]?.label}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openModal('bus', b)}>✏️</button>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteBus(b.id)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* الاشتراكات */}
              {tab === 'subscriptions' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>رقم الطالب</th>
                        <th>الخط</th>
                        <th>الحافلة</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                        <th>من</th>
                        <th>إلى</th>
                        <th>نقطة الالتقاط</th>
                        <th>الحالة</th>
                        <th>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.length === 0 ? (
                        <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>لا توجد اشتراكات</td></tr>
                      ) : subscriptions.map(s => (
                        <tr key={s.id}>
                          <td>#{s.student_id}</td>
                          <td>{s.route?.name || '—'}</td>
                          <td>{s.bus?.bus_number || '—'}</td>
                          <td><span className="badge badge-blue">{subTypeMap[s.subscription_type]}</span></td>
                          <td>{Number(s.amount).toLocaleString()} ريال</td>
                          <td>{s.start_date}</td>
                          <td>{s.end_date || '—'}</td>
                          <td>{s.pickup_point || '—'}</td>
                          <td><span className={`badge ${subStatusMap[s.status]?.cls}`}>{subStatusMap[s.status]?.label}</span></td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={() => openModal('sub', s)}>✏️</button>
                          </td>
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

      {/* Modal خط سير */}
      {modal === 'route' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'تعديل خط السير' : 'إضافة خط سير جديد'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">اسم الخط *</label>
                  <input className="form-control" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">نقطة البداية</label>
                  <input className="form-control" value={form.start_point || ''} onChange={e => setForm({ ...form, start_point: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">نقطة النهاية</label>
                  <input className="form-control" value={form.end_point || ''} onChange={e => setForm({ ...form, end_point: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">المسافة (كم)</label>
                  <input type="number" className="form-control" value={form.distance_km || ''} onChange={e => setForm({ ...form, distance_km: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">الرسوم الشهرية (ريال)</label>
                  <input type="number" className="form-control" value={form.monthly_fee || ''} onChange={e => setForm({ ...form, monthly_fee: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">الرسوم السنوية (ريال)</label>
                  <input type="number" className="form-control" value={form.yearly_fee || ''} onChange={e => setForm({ ...form, yearly_fee: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة</label>
                  <select className="form-control" value={form.is_active ?? true} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                    <option value="true">نشط</option>
                    <option value="false">متوقف</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">ملاحظات</label>
                  <textarea className="form-control" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveRoute}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal حافلة */}
      {modal === 'bus' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'تعديل حافلة' : 'إضافة حافلة جديدة'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">رقم الحافلة *</label>
                  <input className="form-control" value={form.bus_number || ''} onChange={e => setForm({ ...form, bus_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم اللوحة</label>
                  <input className="form-control" value={form.plate_number || ''} onChange={e => setForm({ ...form, plate_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">اسم السائق</label>
                  <input className="form-control" value={form.driver_name || ''} onChange={e => setForm({ ...form, driver_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">هاتف السائق</label>
                  <input className="form-control" value={form.driver_phone || ''} onChange={e => setForm({ ...form, driver_phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">الطاقة الاستيعابية</label>
                  <input type="number" className="form-control" value={form.capacity || 40} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">خط السير</label>
                  <select className="form-control" value={form.route_id || ''} onChange={e => setForm({ ...form, route_id: e.target.value })}>
                    <option value="">— اختر الخط —</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة</label>
                  <select className="form-control" value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">نشطة</option>
                    <option value="maintenance">في الصيانة</option>
                    <option value="inactive">متوقفة</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveBus}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal اشتراك */}
      {modal === 'sub' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'تعديل اشتراك' : 'إضافة اشتراك جديد'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">رقم الطالب *</label>
                  <input type="number" className="form-control" value={form.student_id || ''} onChange={e => setForm({ ...form, student_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">خط السير *</label>
                  <select className="form-control" value={form.route_id || ''} onChange={e => setForm({ ...form, route_id: e.target.value })}>
                    <option value="">— اختر —</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الحافلة</label>
                  <select className="form-control" value={form.bus_id || ''} onChange={e => setForm({ ...form, bus_id: e.target.value })}>
                    <option value="">— اختر —</option>
                    {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">نوع الاشتراك</label>
                  <select className="form-control" value={form.subscription_type || 'monthly'} onChange={e => setForm({ ...form, subscription_type: e.target.value })}>
                    <option value="daily">يومي</option>
                    <option value="monthly">شهري</option>
                    <option value="yearly">سنوي</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ (ريال)</label>
                  <input type="number" className="form-control" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">نقطة الالتقاط</label>
                  <input className="form-control" value={form.pickup_point || ''} onChange={e => setForm({ ...form, pickup_point: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ البداية</label>
                  <input type="date" className="form-control" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ النهاية</label>
                  <input type="date" className="form-control" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
                {form.id && (
                  <div className="form-group">
                    <label className="form-label">الحالة</label>
                    <select className="form-control" value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">نشط</option>
                      <option value="expired">منتهي</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveSub}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
