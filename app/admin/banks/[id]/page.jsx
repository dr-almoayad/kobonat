'use client';
// app/admin/banks/[id]/page.jsx
import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const NETWORKS  = ['VISA', 'MASTERCARD', 'MADA', 'AMEX', 'UNIONPAY'];
const TIERS     = ['CLASSIC', 'GOLD', 'PLATINUM', 'SIGNATURE', 'INFINITE', 'WORLD_ELITE'];
const TABS      = ['Info', 'Cards', 'Niche Scores'];

// ─── tiny helpers ──────────────────────────────────────────────────────────────
function F({ label, type = 'text', step, min, max, value, onChange, dir, placeholder, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...style }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} step={step} min={min} max={max} value={value ?? ''} dir={dir} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 4, color: 'var(--ap-text-primary)', padding: '0.35rem 0.6rem', fontSize: '0.82rem', fontFamily: type === 'number' ? 'var(--ap-mono)' : 'inherit', width: '100%' }} />
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 4, color: 'var(--ap-text-primary)', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: 'var(--ap-text-secondary)' }}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Row({ children, cols = 2 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.75rem', marginBottom: '0.75rem' }}>{children}</div>;
}

// ─── Radar chart (SVG, no library) ────────────────────────────────────────────
function RadarChart({ data, size = 220 }) {
  // data: [{ label, value (0–10) }]
  if (!data?.length) return null;

  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n  = data.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const pt = (i, radius) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const dataPoints = data.map((d, i) => pt(i, r * (d.value / 10)));
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {gridLevels.map(lvl => (
        <polygon key={lvl}
          points={Array.from({ length: n }, (_, i) => { const p = pt(i, r * lvl); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="var(--ap-border)" strokeWidth={0.8} />
      ))}
      {/* Spoke lines */}
      {data.map((_, i) => {
        const end = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--ap-border)" strokeWidth={0.8} />;
      })}
      {/* Data polygon */}
      <polygon points={polyPoints} fill="rgba(31,111,235,0.18)" stroke="#388bfd" strokeWidth={2} strokeLinejoin="round" />
      {/* Data points */}
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#388bfd" />)}
      {/* Labels */}
      {data.map((d, i) => {
        const lpt = pt(i, r + 20);
        return (
          <text key={i} x={lpt.x} y={lpt.y} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 9, fill: 'var(--ap-text-secondary)', fontFamily: 'var(--ap-mono)', fontWeight: 700, textTransform: 'uppercase' }}>
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Default empty card form ───────────────────────────────────────────────────
const emptyCard = () => ({
  network: 'VISA', tier: 'CLASSIC', isIslamic: false, image: '',
  annualFee: '', minSalary: '', foreignTxFeePercent: '',
  loungeAccessPerYear: '', hasTravelInsurance: false, hasPurchaseProtection: false,
  hasApplePay: true, hasGooglePay: true, hasSamsungPay: false,
  cashbackGeneral: '', cashbackTravel: '', cashbackDining: '', cashbackShopping: '',
  cashbackFuel: '', cashbackGaming: '', cashbackGroceries: '', cashbackOnline: '', cashbackHealthcare: '',
  maxInstallmentMonths: '',
  name_en: '', name_ar: '', description_en: '', description_ar: '', benefits_en: '', benefits_ar: '',
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BankDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const [tab,    setTab]    = useState('Info');
  const [bank,   setBank]   = useState(null);
  const [info,   setInfo]   = useState({});
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');
  const [isPending, startT] = useTransition();

  // Card form
  const [showCardForm, setShowCardForm] = useState(false);
  const [editCardId,   setEditCardId]   = useState(null);
  const [cardForm,     setCardForm]     = useState(emptyCard());

  // Niche snapshots
  const [niches, setNiches] = useState([]);

  useEffect(() => { load(); }, [id]);

  // ── PATCH: replace the load() function in app/admin/banks/[id]/page.jsx ──────
//
// Find the existing load() function (called inside useEffect) and replace it
// entirely with this version. Two fixes:
//
//  1. Niches URL corrected: /api/admin/niches doesn't exist.
//     The niches page fetches /api/admin/categories?locale=en and filters
//     client-side for rows where bankScoringWeights is non-empty.
//
//  2. Wrapped in try/catch so a failing niches fetch never blocks bank data
//     from rendering. The page shows the bank even if niches fail to load.

  async function load() {
    try {
      const [bankRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/banks/${id}`),
        fetch('/api/admin/categories?locale=en'),   // ← was /api/admin/niches (doesn't exist)
      ]);

      // Bank data is critical — surface the error if it fails
      if (!bankRes.ok) {
        console.error(`Bank fetch failed: ${bankRes.status}`);
        setBank({});   // set to non-null so the loading screen ends and shows a useful state
        return;
      }

      const bankData = await bankRes.json();
      setBank(bankData);

      const en = bankData.translations?.find(t => t.locale === 'en') || {};
      const ar = bankData.translations?.find(t => t.locale === 'ar') || {};
      setInfo({
        slug:           bankData.slug,
        logo:           bankData.logo,
        color:          bankData.color,
        websiteUrl:     bankData.websiteUrl,
        type:           bankData.type,
        appRating:      bankData.appRating,
        isActive:       bankData.isActive,
        name_en:        en.name,
        description_en: en.description,
        name_ar:        ar.name,
        description_ar: ar.description,
      });

      // Niches are optional — if they fail the rest of the page still works
      if (categoriesRes.ok) {
        const allCategories = await categoriesRes.json();
        // Filter to only categories that have bankScoringWeights defined
        const nicheCategories = (allCategories || []).filter(
          c => c.bankScoringWeights && Object.keys(c.bankScoringWeights).length > 0
        );
        setNiches(nicheCategories);
      }
    } catch (err) {
      console.error('Bank page load error:', err);
      // Ensure we exit the loading state even on unexpected errors
      if (!bank) setBank({});
    }
  }


  async function saveInfo(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/banks/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(info),
    });
    setSaving(false);
    setMsg(res.ok ? '✓ Saved' : '✗ Failed');
    setTimeout(() => setMsg(''), 3000);
    if (res.ok) load();
  }

  function openNewCard()    { setCardForm(emptyCard()); setEditCardId(null); setShowCardForm(true); }
  function openEditCard(c)  {
    const en = c.translations?.find(t => t.locale === 'en') || {};
    const ar = c.translations?.find(t => t.locale === 'ar') || {};
    setCardForm({ ...c, name_en: en.name, name_ar: ar.name, description_en: en.description, description_ar: ar.description, benefits_en: en.benefits, benefits_ar: ar.benefits });
    setEditCardId(c.id);
    setShowCardForm(true);
  }

  async function saveCard(e) {
    e.preventDefault();
    const url    = editCardId ? `/api/admin/banks/${id}/cards/${editCardId}` : `/api/admin/banks/${id}/cards`;
    const method = editCardId ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cardForm) });
    if (res.ok) { setShowCardForm(false); load(); }
    else { const d = await res.json(); alert(d.error || 'Failed'); }
  }

  async function deleteCard(cardId) {
    if (!confirm('Delete this card?')) return;
    await fetch(`/api/admin/banks/${id}/cards/${cardId}`, { method: 'DELETE' });
    load();
  }

  if (!bank) return <div className="ap-root"><div className="ap-page" style={{ color: 'var(--ap-text-muted)' }}>Loading…</div></div>;

  const bankName = bank.translations?.find(t => t.locale === 'en')?.name || bank.slug;

  return (
    <div className="ap-root">
      <div className="ap-page">

        {/* Header */}
        <div className="ap-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/admin/banks" style={{ color: 'var(--ap-text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>← Banks</Link>
            <h1 className="ap-page-title">{bankName}</h1>
            <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 3, fontWeight: 700,
              background: bank.isActive ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)',
              color: bank.isActive ? 'var(--ap-green)' : 'var(--ap-red)' }}>
              {bank.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          {msg && <span style={{ fontSize: '0.8rem', color: msg.startsWith('✓') ? 'var(--ap-green)' : 'var(--ap-red)' }}>{msg}</span>}
        </div>

        {/* Tabs */}
        <div className="ap-tabs" style={{ marginBottom: '1.5rem' }}>
          {TABS.map(t => (
            <button key={t} className={`ap-tab${tab === t ? ' ap-tab--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* ── INFO TAB ── */}
        {tab === 'Info' && (
          <div className="ap-card" style={{ padding: '1.25rem' }}>
            <form onSubmit={saveInfo}>
              <Row><F label="Slug" value={info.slug} onChange={v => setInfo(f => ({ ...f, slug: v }))} />
                <Sel label="Type" value={info.type} onChange={v => setInfo(f => ({ ...f, type: v }))} options={['COMMERCIAL', 'ISLAMIC', 'DIGITAL']} />
              </Row>
              <Row>
                <F label="Name (EN)" value={info.name_en} onChange={v => setInfo(f => ({ ...f, name_en: v }))} />
                <F label="Name (AR)" value={info.name_ar} onChange={v => setInfo(f => ({ ...f, name_ar: v }))} dir="rtl" />
              </Row>
              <Row>
                <F label="Logo URL" value={info.logo} onChange={v => setInfo(f => ({ ...f, logo: v }))} />
                <F label="Website" value={info.websiteUrl} onChange={v => setInfo(f => ({ ...f, websiteUrl: v }))} />
              </Row>
              <Row>
                <F label="Brand Color" type="color" value={info.color || '#000000'} onChange={v => setInfo(f => ({ ...f, color: v }))} />
                <F label="App Rating (0–5)" type="number" step="0.1" min="0" max="5" value={info.appRating} onChange={v => setInfo(f => ({ ...f, appRating: v }))} />
              </Row>
              <Row cols={1}><F label="Description (EN)" value={info.description_en} onChange={v => setInfo(f => ({ ...f, description_en: v }))} /></Row>
              <Row cols={1}><F label="Description (AR)" value={info.description_ar} onChange={v => setInfo(f => ({ ...f, description_ar: v }))} dir="rtl" /></Row>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <button type="submit" className="ap-btn ap-btn--primary ap-btn--sm" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <Toggle label="Active" checked={info.isActive} onChange={v => setInfo(f => ({ ...f, isActive: v }))} />
              </div>
            </form>
          </div>
        )}

        {/* ── CARDS TAB ── */}
        {tab === 'Cards' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={() => showCardForm ? setShowCardForm(false) : openNewCard()}>
                {showCardForm ? '✕ Cancel' : '+ Add Card'}
              </button>
            </div>

            {/* Card form */}
            {showCardForm && (
              <div className="ap-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ap-text-primary)', marginBottom: '1rem' }}>
                  {editCardId ? 'Edit Card' : 'New Card'}
                </h3>
                <form onSubmit={saveCard}>
                  <Row>
                    <F label="Name (EN) *" value={cardForm.name_en} onChange={v => setCardForm(f => ({ ...f, name_en: v }))} />
                    <F label="Name (AR)" value={cardForm.name_ar} onChange={v => setCardForm(f => ({ ...f, name_ar: v }))} dir="rtl" />
                  </Row>
                  <Row>
                    <Sel label="Network" value={cardForm.network} onChange={v => setCardForm(f => ({ ...f, network: v }))} options={NETWORKS} />
                    <Sel label="Tier" value={cardForm.tier} onChange={v => setCardForm(f => ({ ...f, tier: v }))} options={TIERS} />
                  </Row>
                  <Row cols={3}>
                    <F label="Annual Fee (SAR)" type="number" value={cardForm.annualFee} onChange={v => setCardForm(f => ({ ...f, annualFee: v }))} />
                    <F label="Min Salary (SAR)" type="number" value={cardForm.minSalary} onChange={v => setCardForm(f => ({ ...f, minSalary: v }))} />
                    <F label="Foreign TX Fee %" type="number" step="0.1" value={cardForm.foreignTxFeePercent} onChange={v => setCardForm(f => ({ ...f, foreignTxFeePercent: v }))} />
                  </Row>
                  <Row cols={4}>
                    <F label="Lounge / year" type="number" value={cardForm.loungeAccessPerYear} onChange={v => setCardForm(f => ({ ...f, loungeAccessPerYear: v }))} />
                    <F label="Max Install. months" type="number" value={cardForm.maxInstallmentMonths} onChange={v => setCardForm(f => ({ ...f, maxInstallmentMonths: v }))} />
                    <F label="Card Image URL" value={cardForm.image} onChange={v => setCardForm(f => ({ ...f, image: v }))} style={{ gridColumn: 'span 2' }} />
                  </Row>

                  <div style={{ marginBottom: '0.75rem', color: 'var(--ap-text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cashback Rates (%)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
                    {[['General', 'cashbackGeneral'], ['Travel', 'cashbackTravel'], ['Dining', 'cashbackDining'],
                      ['Shopping', 'cashbackShopping'], ['Fuel', 'cashbackFuel'], ['Gaming', 'cashbackGaming'],
                      ['Groceries', 'cashbackGroceries'], ['Online', 'cashbackOnline'], ['Healthcare', 'cashbackHealthcare'],
                    ].map(([lbl, key]) => (
                      <F key={key} label={lbl} type="number" step="0.1" min="0" max="100"
                        value={cardForm[key]} onChange={v => setCardForm(f => ({ ...f, [key]: v }))} />
                    ))}
                  </div>

                  <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {[['isIslamic','Islamic'], ['hasTravelInsurance','Travel Insurance'], ['hasPurchaseProtection','Purchase Protection'],
                      ['hasApplePay','Apple Pay'], ['hasGooglePay','Google Pay'], ['hasSamsungPay','Samsung Pay']
                    ].map(([key, lbl]) => (
                      <Toggle key={key} label={lbl} checked={cardForm[key]} onChange={v => setCardForm(f => ({ ...f, [key]: v }))} />
                    ))}
                  </div>

                  <button type="submit" className="ap-btn ap-btn--primary ap-btn--sm">{editCardId ? 'Save Card' : 'Create Card'}</button>
                </form>
              </div>
            )}

            {/* Cards list */}
            {bank.cards?.length === 0 && !showCardForm && (
              <div className="ap-empty">No cards yet — add the first one above.</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {bank.cards?.map(card => {
                const cname = card.translations?.find(t => t.locale === 'en')?.name || `${card.network} ${card.tier}`;
                return (
                  <div key={card.id} className="ap-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--ap-text-primary)', marginBottom: 2 }}>{cname}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {[card.network, card.tier, card.isIslamic && 'Islamic'].filter(Boolean).map(tag => (
                            <span key={tag} style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--ap-surface-2)', color: 'var(--ap-text-secondary)', border: '1px solid var(--ap-border)' }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEditCard(card)} className="ap-btn ap-btn--ghost ap-btn--sm">Edit</button>
                        <button onClick={() => deleteCard(card.id)} className="ap-btn ap-btn--danger ap-btn--sm">Del</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--ap-text-secondary)' }}>
                      {card.annualFee != null && <Stat label="Annual Fee" val={`SAR ${card.annualFee}`} />}
                      {card.cashbackGeneral != null && <Stat label="Cashback" val={`${card.cashbackGeneral}%`} />}
                      {card.foreignTxFeePercent != null && <Stat label="FX Fee" val={`${card.foreignTxFeePercent}%`} />}
                      {card.loungeAccessPerYear != null && <Stat label="Lounge" val={`${card.loungeAccessPerYear}/yr`} />}
                      {card.cashbackTravel != null && <Stat label="Travel CB" val={`${card.cashbackTravel}%`} />}
                      {card.cashbackDining != null && <Stat label="Dining CB" val={`${card.cashbackDining}%`} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NICHE SCORES TAB ── */}
        {tab === 'Niche Scores' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }}>
              <button
                className="ap-btn ap-btn--primary ap-btn--sm"
                onClick={async () => {
                  const res = await fetch('/api/admin/bank-leaderboard/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                  const d = await res.json();
                  alert(res.ok ? `✓ Done — ${d.snapshotsUpserted} snapshots updated` : `Error: ${d.error}`);
                  load();
                }}
              >⚡ Recalculate Now</button>
            </div>

            {/* Latest snapshots for this bank */}
            {(() => {
              const snaps = bank.nicheSnapshots ?? [];
              if (!snaps.length) return <div className="ap-empty">No snapshots yet — run the calculation above.</div>;

              // Most recent per niche
              const latest = new Map();
              for (const s of snaps) {
                const existing = latest.get(s.nicheId);
                if (!existing || s.weekIdentifier > existing.weekIdentifier) latest.set(s.nicheId, s);
              }

              const rows = [...latest.values()].sort((a, b) => b.score - a.score);

              // Build radar data from the union of all niche criteria
              // (show best/highest score per criterion across all niches)
              const radarMap = {};
              for (const snap of rows) {
                for (const [k, v] of Object.entries(snap.scoreBreakdown || {})) {
                  radarMap[k] = Math.max(radarMap[k] ?? 0, v);
                }
              }
              const radarData = Object.entries(radarMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([label, value]) => ({ label: label.replace(/([A-Z])/g, ' $1').trim().toUpperCase().slice(0, 6), value }));

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                  {/* Radar chart */}
                  <div className="ap-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ap-text-muted)' }}>Overall Profile</div>
                    <RadarChart data={radarData} size={200} />
                    <div style={{ fontSize: '0.68rem', color: 'var(--ap-text-muted)', textAlign: 'center' }}>Best scores across all criteria</div>
                  </div>

                  {/* Niche score table */}
                  <div className="ap-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--ap-border)' }}>
                          {['Niche', 'Week', 'Score', 'Rank', '△', 'Best Card Criteria'].map(h => (
                            <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ap-text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(snap => {
                          const niche = niches.find(n => n.id === snap.nicheId);
                          const nicheName = niche?.translations?.find(t => t.locale === 'en')?.name || `#${snap.nicheId}`;
                          const mvColor = snap.movement === 'UP' ? 'var(--ap-green)' : snap.movement === 'DOWN' ? 'var(--ap-red)' : 'var(--ap-text-muted)';
                          const mvIcon  = snap.movement === 'UP' ? '▲' : snap.movement === 'DOWN' ? '▼' : '—';
                          const topCriteria = Object.entries(snap.scoreBreakdown || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);

                          return (
                            <tr key={snap.nicheId} style={{ borderBottom: '1px solid var(--ap-border-light)' }}>
                              <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--ap-text-primary)' }}>
                                <span className="material-symbols-sharp" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: 4 }}>{niche?.icon || 'star'}</span>
                                {nicheName}
                              </td>
                              <td style={{ padding: '0.65rem 1rem', fontFamily: 'var(--ap-mono)', fontSize: '0.72rem', color: 'var(--ap-text-muted)' }}>{snap.weekIdentifier}</td>
                              <td style={{ padding: '0.65rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 60, height: 6, borderRadius: 3, background: 'var(--ap-border)', overflow: 'hidden' }}>
                                    <div style={{ width: `${snap.score}%`, height: '100%', borderRadius: 3, background: snap.score > 70 ? 'var(--ap-green)' : snap.score > 40 ? 'var(--ap-amber)' : 'var(--ap-red)' }} />
                                  </div>
                                  <span style={{ fontFamily: 'var(--ap-mono)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--ap-text-primary)' }}>{snap.score.toFixed(1)}</span>
                                </div>
                              </td>
                              <td style={{ padding: '0.65rem 1rem', fontFamily: 'var(--ap-mono)', fontWeight: 700, color: 'var(--ap-text-primary)' }}>#{snap.rank}</td>
                              <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: mvColor }}>{mvIcon}</td>
                              <td style={{ padding: '0.65rem 1rem' }}>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {topCriteria.map(([k, v]) => (
                                    <span key={k} style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: 3, background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', color: 'var(--ap-text-secondary)', fontFamily: 'var(--ap-mono)' }}>
                                      {k.replace(/([A-Z])/g, ' $1').trim()} {v.toFixed(1)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}

function Stat({ label, val }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: '0.6rem', color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontFamily: 'var(--ap-mono)', fontWeight: 600, color: 'var(--ap-text-primary)' }}>{val}</span>
    </div>
  );
}
