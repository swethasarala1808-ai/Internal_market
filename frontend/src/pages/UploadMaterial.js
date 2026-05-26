import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: 'poster', label: '🖼️ Poster' },
  { value: 'advertisement', label: '📢 Advertisement' },
  { value: 'content', label: '📝 Content' },
  { value: 'video', label: '🎬 Video' },
  { value: 'brochure', label: '📄 Brochure' },
  { value: 'social_media', label: '📱 Social Media' },
  { value: 'other', label: '📦 Other' }
];

export default function UploadMaterial() {
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', type: '', solution: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedMaterial, setUploadedMaterial] = useState(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [phones, setPhones] = useState([]);
  const [currentPhone, setCurrentPhone] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (showWhatsApp) {
      API.get('/users/internal-phones').then(r => setPhones(r.data.phones || [])).catch(() => {});
    }
  }, [showWhatsApp]);

  const sendWhatsAppToAll = () => {
    if (!uploadedMaterial || phones.length === 0) return;
    setSending(true);
    const appUrl = 'https://internal-market.vercel.app';
    const materialUrl = `${appUrl}/material/${uploadedMaterial._id}`;
    const msg = `📢 *New Marketing Material Uploaded!*

*${uploadedMaterial.title}*
📁 Type: ${uploadedMaterial.type.replace('_', ' ')}

👉 View & give feedback:
${materialUrl}`;

    phones.forEach((phone, index) => {
      setTimeout(() => {
        const cleanPhone = phone.replace(/\s/g, '').replace('+', '');
        const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : \`91\${cleanPhone}\`;
        const waUrl = \`https://wa.me/\${phoneWithCode}?text=\${encodeURIComponent(msg)}\`;
        window.open(waUrl, '_blank');
        setCurrentPhone(index + 1);
        if (index === phones.length - 1) {
          setSending(false);
          setTimeout(() => navigate(\`/material/\${uploadedMaterial._id}\`), 2000);
        }
      }, index * 2500);
    });
  };

  useEffect(() => {
    API.get('/solutions').then(r => setSolutions(r.data.solutions)).catch(console.error);
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setFiles(Array.from(e.dataTransfer.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.type || !form.solution) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('type', form.type);
      fd.append('solution', form.solution);
      files.forEach(f => fd.append('files', f));

      const res = await API.post('/materials', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const material = res.data.material;
      toast.success('Material uploaded! Email notifications sent!');
      setUploadedMaterial(material);
      setShowWhatsApp(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (showWhatsApp && uploadedMaterial) {
    return (
      <div className="page-container" style={{ maxWidth: 600, textAlign: 'center' }}>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ fontSize: 60 }}>✅</div>
          <h2 style={{ color: '#00C851', marginBottom: 8 }}>Material Uploaded!</h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>
            📧 Email sent to all team members.<br/>
            Now send WhatsApp notification to <strong>{phones.length} members</strong>
          </p>

          {phones.length > 0 ? (
            <>
              <button
                onClick={sendWhatsAppToAll}
                disabled={sending}
                style={{
                  background: '#25d366', color: 'white', border: 'none',
                  padding: '16px 32px', borderRadius: 10, fontSize: 18,
                  fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer',
                  width: '100%', marginBottom: 12
                }}>
                {sending
                  ? `📱 Sending... (${currentPhone}/${phones.length})`
                  : `📱 Send WhatsApp to All ${phones.length} Members`}
              </button>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                WhatsApp will open for each member. Click Send in each chat.
              </p>
            </>
          ) : (
            <p style={{ color: '#f59e0b', background: '#fef3c7', padding: 12, borderRadius: 8 }}>
              ⚠️ No members have added phone numbers yet.<br/>
              Ask them to add phone in Profile settings.
            </p>
          )}

          <button
            onClick={() => navigate(`/material/${uploadedMaterial._id}`)}
            style={{ marginTop: 16, background: 'transparent', border: '1px solid #00C851',
              color: '#00C851', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', width: '100%' }}>
            Skip & View Material →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1 className="page-title">📤 Upload Marketing Material</h1>
        <p className="page-subtitle">Internal team will be notified via Email & WhatsApp</p>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-control" placeholder="e.g. Q1 HR Module Launch Poster"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">BAS Solution *</label>
                <select className="form-control" value={form.solution}
                  onChange={e => setForm({...form, solution: e.target.value})} required>
                  <option value="">Select solution...</option>
                  {solutions.map(s => (
                    <option key={s._id} value={s._id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Material Type *</label>
                <select className="form-control" value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})} required>
                  <option value="">Select type...</option>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea className="form-control" rows={3}
                placeholder="Brief description of this material and its purpose..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Files (Images, PDFs, Videos)</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
                style={{
                  border: `2px dashed ${dragOver ? '#00C851' : '#d1d5db'}`,
                  borderRadius: 10, padding: 32, textAlign: 'center',
                  cursor: 'pointer', background: dragOver ? '#f5f3ff' : '#fafafa',
                  transition: 'all 0.15s'
                }}>
                <input id="file-input" type="file" multiple onChange={handleFileChange}
                  accept="image/*,application/pdf,video/*,.zip" style={{ display: 'none' }} />
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                <div style={{ fontWeight: 600 }}>Drop files here or click to browse</div>
                <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
                  Images, PDFs, Videos up to 20MB
                </div>
              </div>

              {files.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                      background: '#f5f3ff', borderRadius: 6, marginBottom: 4 }}>
                      <span>📎</span>
                      <span style={{ flex: 1, fontSize: 13 }}>{f.name}</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? '⏳ Uploading...' : '🚀 Upload & Notify Team'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
