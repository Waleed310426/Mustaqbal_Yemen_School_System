import { useState, useEffect } from 'react';
import Layout from '../../shared/components/Layout';
import api from '../../shared/apiClient';

const orderTypeMap = { in: { label: 'توريد', cls: 'badge-green' }, out: { label: 'صرف', cls: 'badge-red' } };

export default function InventoryPage() {
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filterCat, setFilterCat] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCat) params.category_id = filterCat;
      if (lowStockOnly) params.low_stock = true;

      const [it, cat, sup, ord, st] = await Promise.all([
        api.get('/inventory/items', { params }),
        api.get('/inventory/categories'),
        api.get('/inventory/suppliers'),
        api.get('/inventory/orders'),
        api.get('/inventory/stats'),
      ]);
      setItems(it.data.data);
      setCategories(cat.data.data);
      setSuppliers(sup.data.data);
      setOrders(ord.data.data);
      setStats(st.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterCat, lowStockOnly]);

  const openModal = (type, data = {}) => { setModal(type); setForm(data); };
  const closeModal = () => { setModal(null); setForm({}); };

  const saveItem = async () => {
    try {
      if (form.id) await api.put(`/inventory/items/${form.id}`, form);
      else await api.post('/inventory/items', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.message || 'خطأ'); }
  };

  const saveSupplier = async () => {
    try {
      if (form.id) await api.put(`/inventory/suppliers/${form.id}`, form);
      else await api.post('/inventory/suppliers', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.message || 'خطأ'); }
  };

  const saveOrder = async () => {
    try {
      await api.post('/inventory/orders', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.message || 'خطأ'); }
  };

  const saveCategory = async () => {
    try {
      await api.post('/inventory/categories', form);
      load(); closeModal();
    } catch (e) { alert(e.response?.data?.message || 'خطأ'); }
  };

  const deleteItem = async (id) => {
    if (!confirm('هل تريد إلغاء تفعيل هذا الصنف؟')) return;
    await api.delete(`/inventory/items/${id}`); load();
  };

  // جمع كل الأصناف من الفئات بشكل مسطح
  const flatCategories = [];
  const flatten = (cats, prefix = '') => cats.forEach(c => {
    flatCategories.push({ ...c, displayName: prefix + c.name });
    if (c.children?.length) flatten(c.children, prefix + c.name + ' / ');
  });
  flatten(categories);

  return (
    <Layout title="مخازن المدرسة">
      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 28 }}>
          <div className="stat-card blue">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{stats.totalItems}</div>
            <div className="stat-label">إجمالي الأصناف</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{Number(stats.totalValue).toLocaleString()}</div>
            <div className="stat-label">قيمة المخزون (ريال)</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon">⚠️</div>
            <div className="stat-value">{stats.lowStockItems?.length || 0}</div>
            <div className="stat-label">أصناف تحت الحد الأدنى</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon">🏪</div>
            <div className="stat-value">{stats.totalSuppliers}</div>
            <div className="stat-label">موردون</div>
          </div>
        </div>
      )}

      {/* تنبيه أصناف منخفضة */}
      {stats?.lowStockItems?.length > 0 && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10,
          padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <strong style={{ color: '#c2410c' }}>تنبيه: أصناف تحتاج تعبئة</strong>
            <p style={{ fontSize: 13, color: '#9a3412', marginTop: 2 }}>
              {stats.lowStockItems.map(i => `${i.name} (${i.quantity}/${i.min_quantity})`).join(' — ')}
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ gap: 0, padding: '0 24px' }}>
          {[
            { key: 'items', label: '📦 الأصناف' },
            { key: 'orders', label: '📋 أوامر المخزون' },
            { key: 'suppliers', label: '🏪 الموردون' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '18px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif', fontSize: 14,
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--primary)' : 'var(--gray-500)',
              borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
          <div style={{ flex: 1 }} />

          {tab === 'items' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="form-control" style={{ width: 160 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">كل الفئات</option>
                {flatCategories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} />
                منخفض فقط
              </label>
              <button className="btn btn-ghost btn-sm" onClick={() => openModal('cat')}>+ فئة</button>
            </div>
          )}

          <button className="btn btn-primary btn-sm" style={{ marginRight: 8 }} onClick={() => openModal(
            tab === 'items' ? 'item' : tab === 'orders' ? 'order' : 'supplier'
          )}>
            + إضافة {tab === 'items' ? 'صنف' : tab === 'orders' ? 'أمر مخزون' : 'مورد'}
          </button>
        </div>

        <div style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>جارٍ التحميل...</div>
          ) : (
            <>
              {/* الأصناف */}
              {tab === 'items' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>اسم الصنف</th>
                        <th>الفئة</th>
                        <th>الرمز (SKU)</th>
                        <th>الكمية</th>
                        <th>الحد الأدنى</th>
                        <th>سعر الوحدة</th>
                        <th>القيمة الإجمالية</th>
                        <th>الوحدة</th>
                        <th>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>لا توجد أصناف</td></tr>
                      ) : items.map(i => (
                        <tr key={i.id} style={{ background: i.quantity <= i.min_quantity ? '#fff7ed' : undefined }}>
                          <td>
                            <strong>{i.name}</strong>
                            {i.quantity <= i.min_quantity && <span style={{ marginRight: 6, fontSize: 12, color: '#c2410c' }}>⚠️ منخفض</span>}
                          </td>
                          <td>{i.category?.name || '—'}</td>
                          <td><code>{i.sku || '—'}</code></td>
                          <td>
                            <span style={{ fontWeight: 700, color: i.quantity <= i.min_quantity ? '#c2410c' : 'var(--success)' }}>
                              {i.quantity}
                            </span>
                          </td>
                          <td>{i.min_quantity}</td>
                          <td>{Number(i.unit_price).toLocaleString()}</td>
                          <td>{(i.quantity * i.unit_price).toLocaleString()} ريال</td>
                          <td>{i.unit}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openModal('item', i)}>✏️</button>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteItem(i.id)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* أوامر المخزون */}
              {tab === 'orders' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>النوع</th>
                        <th>الصنف</th>
                        <th>الكمية</th>
                        <th>سعر الوحدة</th>
                        <th>الإجمالي</th>
                        <th>المورد / المستلم</th>
                        <th>التاريخ</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>لا توجد أوامر</td></tr>
                      ) : orders.map(o => (
                        <tr key={o.id}>
                          <td><span className={`badge ${orderTypeMap[o.order_type].cls}`}>{orderTypeMap[o.order_type].label}</span></td>
                          <td>{o.item?.name || `#${o.item_id}`}</td>
                          <td><strong>{o.quantity}</strong> {o.item?.unit}</td>
                          <td>{Number(o.unit_price).toLocaleString()}</td>
                          <td><strong>{Number(o.total_price).toLocaleString()}</strong> ريال</td>
                          <td>{o.supplier?.name || o.recipient || '—'}</td>
                          <td>{o.order_date}</td>
                          <td>{o.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* الموردون */}
              {tab === 'suppliers' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>اسم المورد</th>
                        <th>هاتف</th>
                        <th>بريد إلكتروني</th>
                        <th>جهة الاتصال</th>
                        <th>العنوان</th>
                        <th>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>لا يوجد موردون</td></tr>
                      ) : suppliers.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.phone || '—'}</td>
                          <td>{s.email || '—'}</td>
                          <td>{s.contact_person || '—'}</td>
                          <td>{s.address || '—'}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={() => openModal('supplier', s)}>✏️</button>
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

      {/* Modal صنف */}
      {modal === 'item' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'تعديل صنف' : 'إضافة صنف جديد'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">اسم الصنف *</label>
                  <input className="form-control" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">الفئة</label>
                  <select className="form-control" value={form.category_id || ''} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">— بدون فئة —</option>
                    {flatCategories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">رمز الصنف (SKU)</label>
                  <input className="form-control" value={form.sku || ''} onChange={e => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">الكمية الحالية</label>
                  <input type="number" className="form-control" value={form.quantity ?? 0} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">الحد الأدنى للتنبيه</label>
                  <input type="number" className="form-control" value={form.min_quantity ?? 5} onChange={e => setForm({ ...form, min_quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">سعر الوحدة (ريال)</label>
                  <input type="number" className="form-control" value={form.unit_price || 0} onChange={e => setForm({ ...form, unit_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">وحدة القياس</label>
                  <input className="form-control" value={form.unit || 'قطعة'} onChange={e => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">وصف</label>
                  <textarea className="form-control" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveItem}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal فئة */}
      {modal === 'cat' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة فئة جديدة</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">اسم الفئة *</label>
                <input className="form-control" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">فئة أب (اختياري)</label>
                <select className="form-control" value={form.parent_id || ''} onChange={e => setForm({ ...form, parent_id: e.target.value || null })}>
                  <option value="">— بدون —</option>
                  {flatCategories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveCategory}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal أمر مخزون */}
      {modal === 'order' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>أمر مخزون جديد</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">نوع الأمر *</label>
                  <select className="form-control" value={form.order_type || 'in'} onChange={e => setForm({ ...form, order_type: e.target.value })}>
                    <option value="in">توريد (إضافة للمخزن)</option>
                    <option value="out">صرف (إخراج من المخزن)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الصنف *</label>
                  <select className="form-control" value={form.item_id || ''} onChange={e => setForm({ ...form, item_id: e.target.value })}>
                    <option value="">— اختر —</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} (المتاح: {i.quantity})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الكمية *</label>
                  <input type="number" min="1" className="form-control" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">سعر الوحدة</label>
                  <input type="number" className="form-control" value={form.unit_price || 0} onChange={e => setForm({ ...form, unit_price: e.target.value })} />
                </div>
                {form.order_type === 'in' ? (
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">المورد</label>
                    <select className="form-control" value={form.supplier_id || ''} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                      <option value="">— اختر مورد —</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">المستلم</label>
                    <input className="form-control" value={form.recipient || ''} onChange={e => setForm({ ...form, recipient: e.target.value })} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">التاريخ</label>
                  <input type="date" className="form-control" value={form.order_date || new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, order_date: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">ملاحظات</label>
                  <textarea className="form-control" rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveOrder}>💾 تنفيذ الأمر</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal مورد */}
      {modal === 'supplier' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'تعديل مورد' : 'إضافة مورد جديد'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">اسم المورد *</label>
                  <input className="form-control" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">هاتف</label>
                  <input className="form-control" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">بريد إلكتروني</label>
                  <input type="email" className="form-control" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">جهة الاتصال</label>
                  <input className="form-control" value={form.contact_person || ''} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">العنوان</label>
                  <input className="form-control" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveSupplier}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
