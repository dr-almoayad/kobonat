'use client';
// app/admin/banks/page.jsx
import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const TYPES = ['COMMERCIAL', 'ISLAMIC', 'DIGITAL'];

export default function BanksPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const showCreate   = searchParams.get('create') === 'true';

  const [banks,     setBanks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [isPending, startTransition] = useTransition();
  const [form,      setForm]      = useState({
    slug:'', name_en:'', name_ar:'', description_en:'', description_ar:'',
    logo:'', color:'#000000', websiteUrl:'', type:'COMMERCIAL', appRating:'', isActive: true,
  });
  const [error, setError] = useState('');

  useEffect(() => { fetchBanks(); }, []);

  async function fetchBanks() {
    setLoading(true);
    const res  = await fetch('/api/admin/banks?locale=en');
    setBanks(await res.json());
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/admin/banks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/admin/banks');
        fetchBanks();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to create bank');
      }
    });
  }

  async function handleDelete(id) {
    if (!confirm('Delete this bank and all its cards?')) return;
    await fetch(`/api/admin/banks/${id}`, { method: 'DELETE' });
    fetchBanks();
  }

  return (
    <div className="ap-root">
      <div className="ap-page">

        {/* Header */}
        <div className="ap-page-header">
          <h1 className="ap-page-title">
            Banks
            <small>{banks.length} registered</small>
          </h1>
          <div className="ap-page-actions">
            <Link href="/admin/banks/niches" className="ap-btn ap-btn--ghost ap-btn--sm">
              Scoring Niches →
            </Link>
            <button
              className="ap-btn ap-btn--primary ap-btn--sm"
              onClick={() => router.push(showCreate ? '/admin/banks' : '/admin/banks?create=true')}
            >
              {showCreate ? '✕ Cancel' : '+ Add Bank'}
            </button>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--ap-text-primary)' }}>
              New Bank
            </h2>
            {error && <div className="ap-alert ap-alert--error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Field label="Slug *" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} placeholder="al-rajhi" />
                <Field label="Type" tag="select" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Field>
                <Field label="Name (EN) *" value={form.name_en} onChange={v => setForm(f => ({ ...f, name_en: v }))} />
                <Field label="Name (AR)" value={form.name_ar} onChange={v => setForm(f => ({ ...f, name_ar: v }))} dir="rtl" />
                <Field label="Logo URL" value={form.logo} onChange={v => setForm(f => ({ ...f, logo: v }))} />
                <Field label="Website URL" value={form.websiteUrl} onChange={v => setForm(f => ({ ...f, websiteUrl: v }))} />
                <Field label="Brand Color" type="color" value={form.color} onChange={v => setForm(f => ({ ...f, color: v }))} />
                <Field label="App Rating (0–5)" type="number" step="0.1" min="0" max="5" value={form.appRating} onChange={v => setForm(f => ({ ...f, appRating: v }))} />
                <Field label="Description (EN)" value={form.description_en} onChange={v => setForm(f => ({ ...f, description_en: v }))} style={{ gridColumn: '1 / -1' }} />
                <Field label="Description (AR)" value={form.description_ar} onChange={v => setForm(f => ({ ...f, description_ar: v }))} dir="rtl" style={{ gridColumn: '1 / -1' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button type="submit" className="ap-btn ap-btn--primary ap-btn--sm" disabled={isPending}>
                  {isPending ? 'Creating…' : 'Create Bank'}
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--ap-text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  Active
                </label>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="ap-card">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ap-border)' }}>
                {['', 'Bank', 'Type', 'Cards', 'Offers', 'App', 'Status', ''].map((h, i) => (
                  <th key={i} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ap-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--ap-text-muted)' }}>Loading…</td></tr>
              )}
              {!loading && banks.map(bank => {
                const name = bank.translations?.[0]?.name || bank.slug;
                return (
                  <tr key={bank.id} style={{ borderBottom: '1px solid var(--ap-border-light)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--ap-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '0.65rem 1rem', width: 40 }}>
                      {bank.logo
                        ? <img src={bank.logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4, background: '#f1f5f9' }} />
                        : <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: 4, background: bank.color || '#334155', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff' }}>{name.charAt(0)}</span>
                      }
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--ap-text-primary)' }}>{name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>{bank.slug}</div>
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: bank.type === 'ISLAMIC' ? 'rgba(63,185,80,0.12)' : bank.type === 'DIGITAL' ? 'rgba(31,111,235,0.12)' : 'rgba(210,153,34,0.12)', color: bank.type === 'ISLAMIC' ? 'var(--ap-green)' : bank.type === 'DIGITAL' ? 'var(--ap-accent)' : 'var(--ap-amber)' }}>
                        {bank.type}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'var(--ap-mono)', color: 'var(--ap-text-secondary)' }}>{bank._count?.cards ?? 0}</td>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'var(--ap-mono)', color: 'var(--ap-text-secondary)' }}>{bank._count?.otherPromos ?? 0}</td>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'var(--ap-mono)', color: 'var(--ap-text-secondary)' }}>{bank.appRating ? `★ ${bank.appRating}` : '—'}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: bank.isActive ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)', color: bank.isActive ? 'var(--ap-green)' : 'var(--ap-red)' }}>
                        {bank.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Link href={`/admin/banks/${bank.id}`} className="ap-btn ap-btn--ghost ap-btn--sm">Edit</Link>
                        <button onClick={() => handleDelete(bank.id)} className="ap-btn ap-btn--danger ap-btn--sm">Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function Field({ label, tag = 'input', children, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...style }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ap-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {tag === 'select'
        ? <select style={{ background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 4, color: 'var(--ap-text-primary)', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }} value={rest.value} onChange={e => rest.onChange(e.target.value)}>{children}</select>
        : <input {...rest} onChange={e => rest.onChange(e.target.value)} style={{ background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 4, color: 'var(--ap-text-primary)', padding: '0.35rem 0.6rem', fontSize: '0.82rem', ...(rest.style || {}) }} />
      }
    </div>
  );
}
