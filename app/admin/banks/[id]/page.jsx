'use client';
// app/admin/banks/[id]/page.jsx

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────

const NETWORKS     = ['VISA', 'MASTERCARD', 'MADA', 'AMEX', 'UNIONPAY'];
const TIERS        = ['CLASSIC', 'GOLD', 'PLATINUM', 'SIGNATURE', 'INFINITE', 'WORLD_ELITE'];
const TABS         = ['Info', 'Cards', 'Niche Scores'];
const REWARD_TYPES = [
  { value: '',         label: '— None —' },
  { value: 'CASHBACK', label: 'Cashback' },
  { value: 'POINTS',   label: 'Points' },
  { value: 'MILES',    label: 'Miles' },
];

// ─── Tiny helper components (match existing page style) ───────────────────────

function F({ label, type = 'text', step, min, max, value, onChange, dir, placeholder, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...style }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <input
        type={type} step={step} min={min} max={max}
        value={value ?? ''} dir={dir} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 4, color: 'var(--ap-text-primary)', padding: '0.35rem 0.6rem', fontSize: '0.82rem', fontFamily: type === 'number' ? 'var(--ap-mono)' : 'inherit', width: '100%' }}
      />
    </div>
  );
}

function TA({ label, value, onChange, rows = 3, placeholder, dir }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <textarea
        rows={rows} value={value ?? ''} dir={dir} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 4, color: 'var(--ap-text-primary)', padding: '0.35rem 0.6rem', fontSize: '0.82rem', resize: 'vertical', width: '100%', fontFamily: 'inherit' }}
      />
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <select
        value={value ?? ''} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 4, color: 'var(--ap-text-primary)', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
      >
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: 'var(--ap-text-secondary)' }}>
      <input
        type="checkbox" checked={!!checked}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: 'var(--ap-primary)', width: 14, height: 14 }}
      />
      {label}
    </label>
  );
}

// Grid row: default 2 cols, pass cols={3} or cols={4} etc.
function Row({ children, cols }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols ?? 2}, 1fr)`, gap: '0.75rem', marginBottom: '0.75rem' }}>
      {children}
    </div>
  );
}

// Collapsible section with divider — used to organise the card form
function CardSection({ title, children, defaultOpen = false, accent }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '0.25rem', borderRadius: 6, border: `1px solid ${accent ? 'var(--ap-primary-subtle, #e0d8ff)' : 'var(--ap-border)'}`, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: accent ? 'var(--ap-primary-subtle, #f3f0ff)' : 'var(--ap-surface-1)', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: accent ? 'var(--ap-primary, #470ae2)' : 'var(--ap-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--ap-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Pair of % + cap fields on one row
function RateCapRow({ label, rateKey, capKey, form, set }) {
  return (
    <Row cols={2}>
      <F label={`${label} %`} type="number" step="0.1" min="0" value={form[rateKey]} onChange={v => set(rateKey, v)} placeholder="0.0" />
      <F label={`${label} Monthly Cap (SAR)`} type="number" min="0" value={form[capKey]} onChange={v => set(capKey, v)} placeholder="e.g. 200" />
    </Row>
  );
}

// ─── Radar / spider chart (for Niche Scores tab) ──────────────────────────────

function RadarChart({ data, size = 200 }) {
  if (!data || data.length === 0) return null;
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = data.length;
  const pt = (i, radius) => ({
    x: cx + radius * Math.sin((2 * Math.PI * i) / n),
    y: cy - radius * Math.cos((2 * Math.PI * i) / n),
  });
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = data.map((d, i) => pt(i, r * (d.value / 100)));
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid polygons */}
      {gridLevels.map(lvl => {
        const pts = Array.from({ length: n }, (_, i) => pt(i, r * lvl));
        return (
          <polygon key={lvl}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="var(--ap-border)" strokeWidth={0.75}
          />
        );
      })}
      {/* Spokes */}
      {data.map((_, i) => {
        const outer = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--ap-border)" strokeWidth={0.75} />;
      })}
      {/* Data polygon */}
      <polygon points={polyPoints} fill="rgba(56,139,253,0.18)" stroke="#388bfd" strokeWidth={2} strokeLinejoin="round" />
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

// ─── Default empty card form ──────────────────────────────────────────────────

const emptyCard = () => ({
  // Identity
  network: 'VISA', tier: 'CLASSIC', isIslamic: false, image: '',
  name_en: '', name_ar: '', description_en: '', description_ar: '', benefits_en: '', benefits_ar: '',

  // Financials
  annualFee: '', minSalary: '', foreignTxFeePercent: '',

  // Perks
  loungeAccessPerYear:  '',
  hasTravelInsurance:   false,
  hasPurchaseProtection: false,
  hasApplePay:          true,
  hasGooglePay:         true,
  hasSamsungPay:        false,
  hasConcierge:         false,   // NEW
  hasExtendedWarranty:  false,   // NEW

  // ── NEW: Reward program ──────────────────────────────────────────────────────
  rewardProgramName: '',
  rewardType:        '',          // 'CASHBACK' | 'POINTS' | 'MILES' | ''

  // ── NEW: Welcome & ongoing bonuses ───────────────────────────────────────────
  welcomeBonusAmount:    '',
  welcomeBonusSpend:     '',
  welcomeBonusDays:      '',
  additionalBonusAmount: '',
  additionalBonusSpend:  '',
  additionalBonusDays:   '',
  renewalBonusAmount:    '',
  bonusNotes:            '',

  // ── NEW: Earn rates (Points / Miles only) ────────────────────────────────────
  domesticEarnRate:     '',
  internationalEarnRate:'',
  airlineSpendEarnRate: '',

  // ── NEW: Per-category cashback rates + caps (Cashback only) ─────────────────
  // (replaces the old flat cashback fields in the scoring engine context;
  //  legacy fields kept below for backward-compat with existing API)
  cashbackDiningPct:       '', cashbackDiningCap:       '',
  cashbackGroceriesPct:    '', cashbackGroceriesCap:    '',
  cashbackOnlinePct:       '', cashbackOnlineCap:       '',
  cashbackIntlOtherPct:    '', cashbackIntlOtherCap:    '',
  cashbackLocalOtherPct:   '', cashbackLocalOtherCap:   '',
  cashbackTotalMonthlyCap: '',

  // Legacy cashback fields (kept for scoring engine back-compat)
  cashbackGeneral: '', cashbackTravel: '', cashbackDining: '', cashbackShopping: '',
  cashbackFuel: '', cashbackGaming: '', cashbackGroceries: '', cashbackOnline: '', cashbackHealthcare: '',

  // ── NEW: Tasaheel (replaces standalone maxInstallmentMonths) ─────────────────
  tasaheelAvailable:   false,
  maxInstallmentMonths: '',

  // ── NEW: Fees ─────────────────────────────────────────────────────────────────
  suppCardFee:          '',
  freeSuppCards:        '',
  cashWithdrawalFeePct: '',
  cashWithdrawalMinFee: '',
  cashWithdrawalMaxFee: '',
  replacementCardFee:   '',
  wrongDisputeFee:      '',
  atmInquiryFee:        '',

  // ── NEW: Payment terms ────────────────────────────────────────────────────────
  monthlyProfitRatePct: '',
  minPaymentPct:        '',
  minPaymentFixed:      '',

  // ── NEW: Required documents ───────────────────────────────────────────────────
  requiredDocuments: '',
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BankDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const [tab,   setTab]   = useState('Info');
  const [bank,  setBank]  = useState(null);
  const [info,  setInfo]  = useState({});
  const [cards, setCards] = useState([]);
  const [niches, setNiches] = useState([]);

  // Card form state
  const [cardForm,      setCardForm]      = useState(emptyCard());
  const [editCardId,    setEditCardId]    = useState(null);
  const [showCardForm,  setShowCardForm]  = useState(false);
  const [savingCard,    setSavingCard]    = useState(false);
  const [savingInfo,    setSavingInfo]    = useState(false);

  // Helper to set a single card field
  const set = (key, value) => setCardForm(f => ({ ...f, [key]: value }));

  // ── Load ────────────────────────────────────────────────────────────────────

  async function load() {
    try {
      const [bankRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/banks/${id}`),
        fetch('/api/admin/categories?locale=en'),
      ]);

      if (!bankRes.ok) {
        console.error(`Bank fetch failed: ${bankRes.status}`);
        setBank({});
        return;
      }

      const bankData = await bankRes.json();
      setBank(bankData);
      setCards(bankData.cards || []);

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
        name_en:        en.name        || '',
        description_en: en.description || '',
        name_ar:        ar.name        || '',
        description_ar: ar.description || '',
      });

      if (categoriesRes.ok) {
        const allCats = await categoriesRes.json();
        setNiches((allCats || []).filter(c => c.bankScoringWeights && Object.keys(c.bankScoringWeights).length > 0));
      }
    } catch (err) {
      console.error('Bank page load error:', err);
      if (!bank) setBank({});
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Card actions ────────────────────────────────────────────────────────────

  function openNewCard() {
    setEditCardId(null);
    setCardForm(emptyCard());
    setShowCardForm(true);
  }

  function openEditCard(c) {
    const en = c.translations?.find(t => t.locale === 'en') || {};
    const ar = c.translations?.find(t => t.locale === 'ar') || {};
    setCardForm({
      // Identity
      network:   c.network,
      tier:      c.tier,
      isIslamic: c.isIslamic,
      image:     c.image || '',
      name_en:        en.name        || '',
      name_ar:        ar.name        || '',
      description_en: en.description || '',
      description_ar: ar.description || '',
      benefits_en:    en.benefits    || '',
      benefits_ar:    ar.benefits    || '',
      // Financials
      annualFee:           c.annualFee           ?? '',
      minSalary:           c.minSalary           ?? '',
      foreignTxFeePercent: c.foreignTxFeePercent ?? '',
      // Perks
      loungeAccessPerYear:   c.loungeAccessPerYear   ?? '',
      hasTravelInsurance:    c.hasTravelInsurance    ?? false,
      hasPurchaseProtection: c.hasPurchaseProtection ?? false,
      hasApplePay:           c.hasApplePay           ?? true,
      hasGooglePay:          c.hasGooglePay          ?? true,
      hasSamsungPay:         c.hasSamsungPay         ?? false,
      hasConcierge:          c.hasConcierge          ?? false,
      hasExtendedWarranty:   c.hasExtendedWarranty   ?? false,
      // Reward program
      rewardProgramName: c.rewardProgramName ?? '',
      rewardType:        c.rewardType        ?? '',
      // Bonuses
      welcomeBonusAmount:    c.welcomeBonusAmount    ?? '',
      welcomeBonusSpend:     c.welcomeBonusSpend     ?? '',
      welcomeBonusDays:      c.welcomeBonusDays      ?? '',
      additionalBonusAmount: c.additionalBonusAmount ?? '',
      additionalBonusSpend:  c.additionalBonusSpend  ?? '',
      additionalBonusDays:   c.additionalBonusDays   ?? '',
      renewalBonusAmount:    c.renewalBonusAmount    ?? '',
      bonusNotes:            c.bonusNotes            ?? '',
      // Earn rates
      domesticEarnRate:      c.domesticEarnRate      ?? '',
      internationalEarnRate: c.internationalEarnRate ?? '',
      airlineSpendEarnRate:  c.airlineSpendEarnRate  ?? '',
      // Cashback rates + caps
      cashbackDiningPct:       c.cashbackDiningPct       ?? '',
      cashbackDiningCap:       c.cashbackDiningCap       ?? '',
      cashbackGroceriesPct:    c.cashbackGroceriesPct    ?? '',
      cashbackGroceriesCap:    c.cashbackGroceriesCap    ?? '',
      cashbackOnlinePct:       c.cashbackOnlinePct       ?? '',
      cashbackOnlineCap:       c.cashbackOnlineCap       ?? '',
      cashbackIntlOtherPct:    c.cashbackIntlOtherPct    ?? '',
      cashbackIntlOtherCap:    c.cashbackIntlOtherCap    ?? '',
      cashbackLocalOtherPct:   c.cashbackLocalOtherPct   ?? '',
      cashbackLocalOtherCap:   c.cashbackLocalOtherCap   ?? '',
      cashbackTotalMonthlyCap: c.cashbackTotalMonthlyCap ?? '',
      // Legacy cashback
      cashbackGeneral:    c.cashbackGeneral    ?? '',
      cashbackTravel:     c.cashbackTravel     ?? '',
      cashbackDining:     c.cashbackDining     ?? '',
      cashbackShopping:   c.cashbackShopping   ?? '',
      cashbackFuel:       c.cashbackFuel       ?? '',
      cashbackGaming:     c.cashbackGaming     ?? '',
      cashbackGroceries:  c.cashbackGroceries  ?? '',
      cashbackOnline:     c.cashbackOnline     ?? '',
      cashbackHealthcare: c.cashbackHealthcare ?? '',
      // Tasaheel
      tasaheelAvailable:   c.tasaheelAvailable   ?? false,
      maxInstallmentMonths: c.maxInstallmentMonths ?? '',
      // Fees
      suppCardFee:          c.suppCardFee          ?? '',
      freeSuppCards:        c.freeSuppCards        ?? '',
      cashWithdrawalFeePct: c.cashWithdrawalFeePct ?? '',
      cashWithdrawalMinFee: c.cashWithdrawalMinFee ?? '',
      cashWithdrawalMaxFee: c.cashWithdrawalMaxFee ?? '',
      replacementCardFee:   c.replacementCardFee   ?? '',
      wrongDisputeFee:      c.wrongDisputeFee      ?? '',
      atmInquiryFee:        c.atmInquiryFee        ?? '',
      // Payment terms
      monthlyProfitRatePct: c.monthlyProfitRatePct ?? '',
      minPaymentPct:        c.minPaymentPct        ?? '',
      minPaymentFixed:      c.minPaymentFixed      ?? '',
      // Documents
      requiredDocuments: c.requiredDocuments ?? '',
    });
    setEditCardId(c.id);
    setShowCardForm(true);
  }

  async function saveCard(e) {
    e.preventDefault();
    setSavingCard(true);
    try {
      const url    = editCardId ? `/api/admin/banks/${id}/cards/${editCardId}` : `/api/admin/banks/${id}/cards`;
      const method = editCardId ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cardForm) });
      if (res.ok) {
        setShowCardForm(false);
        load();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save card');
      }
    } finally {
      setSavingCard(false);
    }
  }

  async function deleteCard(cardId) {
    if (!confirm('Delete this card? This cannot be undone.')) return;
    await fetch(`/api/admin/banks/${id}/cards/${cardId}`, { method: 'DELETE' });
    load();
  }

  // ── Bank info save ──────────────────────────────────────────────────────────

  async function saveInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await fetch(`/api/admin/banks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed'); }
    } finally {
      setSavingInfo(false);
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (!bank) {
    return (
      <div style={{ padding: '2rem', color: 'var(--ap-text-secondary)', fontSize: '0.85rem' }}>
        Loading…
      </div>
    );
  }

  const bankName = bank.translations?.find(t => t.locale === 'en')?.name || bank.slug || 'Bank';

  // ─── Conditional flags ──────────────────────────────────────────────────────
  const isPointsMiles = cardForm.rewardType === 'POINTS' || cardForm.rewardType === 'MILES';
  const isCashback    = cardForm.rewardType === 'CASHBACK';

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: '0.75rem', color: 'var(--ap-text-muted)', marginBottom: '1rem' }}>
        <Link href="/admin/banks" style={{ color: 'var(--ap-text-muted)', textDecoration: 'none' }}>Banks</Link>
        {' / '}
        <span>{bankName}</span>
      </div>

      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {bank.logo && <img src={bank.logo} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--ap-border)' }} />}
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ap-text-primary)', margin: 0 }}>{bankName}</h1>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--ap-border)', paddingBottom: '0.5rem' }}>
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: tab === t ? 700 : 500, background: tab === t ? 'var(--ap-primary, #470ae2)' : 'transparent', color: tab === t ? '#fff' : 'var(--ap-text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          INFO TAB
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'Info' && (
        <div className="ap-card" style={{ padding: '1.25rem' }}>
          <form onSubmit={saveInfo}>
            <Row>
              <F label="Name (EN)" value={info.name_en} onChange={v => setInfo(f => ({ ...f, name_en: v }))} />
              <F label="Name (AR)" value={info.name_ar} onChange={v => setInfo(f => ({ ...f, name_ar: v }))} dir="rtl" />
            </Row>
            <Row>
              <F label="Slug" value={info.slug} onChange={v => setInfo(f => ({ ...f, slug: v }))} placeholder="e.g. al-rajhi" />
              <F label="Website URL" value={info.websiteUrl} onChange={v => setInfo(f => ({ ...f, websiteUrl: v }))} placeholder="https://…" />
            </Row>
            <Row>
              <F label="Logo URL" value={info.logo} onChange={v => setInfo(f => ({ ...f, logo: v }))} placeholder="https://…" />
              <F label="Brand Color" value={info.color} onChange={v => setInfo(f => ({ ...f, color: v }))} placeholder="#0a3d62" />
            </Row>
            <Row cols={3}>
              <Sel label="Type" value={info.type} onChange={v => setInfo(f => ({ ...f, type: v }))}
                options={[{ value: 'COMMERCIAL', label: 'Commercial' }, { value: 'ISLAMIC', label: 'Islamic' }, { value: 'DIGITAL', label: 'Digital' }]} />
              <F label="App Rating" type="number" step="0.1" min="0" max="5" value={info.appRating} onChange={v => setInfo(f => ({ ...f, appRating: v }))} />
            </Row>
            <TA label="Description (EN)" value={info.description_en} onChange={v => setInfo(f => ({ ...f, description_en: v }))} />
            <TA label="Description (AR)" value={info.description_ar} onChange={v => setInfo(f => ({ ...f, description_ar: v }))} dir="rtl" />
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="submit" className="ap-btn ap-btn--primary ap-btn--sm" disabled={savingInfo}>
                {savingInfo ? 'Saving…' : 'Save Changes'}
              </button>
              <Toggle label="Active" checked={info.isActive} onChange={v => setInfo(f => ({ ...f, isActive: v }))} />
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CARDS TAB
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'Cards' && (
        <div>
          {/* Add / cancel button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="ap-btn ap-btn--primary ap-btn--sm" type="button"
              onClick={() => showCardForm ? setShowCardForm(false) : openNewCard()}>
              {showCardForm ? '✕ Cancel' : '+ Add Card'}
            </button>
          </div>

          {/* ── Card form ── */}
          {showCardForm && (
            <div className="ap-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ap-text-primary)', marginBottom: '1rem' }}>
                {editCardId ? 'Edit Card' : 'New Card'}
              </h3>

              <form onSubmit={saveCard}>

                {/* ─────────────────────────────────────────────
                    IDENTITY
                   ───────────────────────────────────────────── */}
                <Row>
                  <F label="Name (EN) *" value={cardForm.name_en} onChange={v => set('name_en', v)} />
                  <F label="Name (AR)" value={cardForm.name_ar} onChange={v => set('name_ar', v)} dir="rtl" />
                </Row>
                <Row>
                  <Sel label="Network" value={cardForm.network} onChange={v => set('network', v)} options={NETWORKS} />
                  <Sel label="Tier" value={cardForm.tier} onChange={v => set('tier', v)} options={TIERS} />
                </Row>
                <Row cols={3}>
                  <F label="Annual Fee (SAR)" type="number" value={cardForm.annualFee} onChange={v => set('annualFee', v)} />
                  <F label="Min Salary (SAR)" type="number" value={cardForm.minSalary} onChange={v => set('minSalary', v)} />
                  <F label="Foreign TX Fee %" type="number" step="0.1" value={cardForm.foreignTxFeePercent} onChange={v => set('foreignTxFeePercent', v)} />
                </Row>
                <Row cols={2}>
                  <F label="Card Image URL" value={cardForm.image} onChange={v => set('image', v)} placeholder="https://…" />
                  <F label="Lounge Access / Year" type="number" value={cardForm.loungeAccessPerYear} onChange={v => set('loungeAccessPerYear', v)} />
                </Row>
                <div style={{ marginBottom: '0.75rem' }}>
                  <Toggle label="Islamic / Shariah-compliant" checked={cardForm.isIslamic} onChange={v => set('isIslamic', v)} />
                </div>

                {/* ─────────────────────────────────────────────
                    1. REWARD PROGRAM
                   ───────────────────────────────────────────── */}
                <CardSection title="① Reward Program" defaultOpen accent>
                  <Row>
                    <F label="Reward Program Name" value={cardForm.rewardProgramName}
                      onChange={v => set('rewardProgramName', v)} placeholder="e.g. Mokafaa, Lak, AlFursan, Waaw" />
                    <Sel label="Reward Type" value={cardForm.rewardType} onChange={v => set('rewardType', v)} options={REWARD_TYPES} />
                  </Row>
                </CardSection>

                {/* ─────────────────────────────────────────────
                    2. WELCOME & ONGOING BONUSES
                   ───────────────────────────────────────────── */}
                <CardSection title="② Welcome & Ongoing Bonuses">
                  <div style={{ fontSize: '0.72rem', color: 'var(--ap-text-muted)', marginBottom: '0.25rem' }}>
                    First-tier welcome bonus triggered by a spend target within N days.
                  </div>
                  <Row cols={3}>
                    <F label="Welcome Bonus Amount" type="number" value={cardForm.welcomeBonusAmount}
                      onChange={v => set('welcomeBonusAmount', v)} placeholder="e.g. 25000" />
                    <F label="Spend Requirement (SAR)" type="number" value={cardForm.welcomeBonusSpend}
                      onChange={v => set('welcomeBonusSpend', v)} placeholder="e.g. 5000" />
                    <F label="Days to Meet Spend" type="number" value={cardForm.welcomeBonusDays}
                      onChange={v => set('welcomeBonusDays', v)} placeholder="e.g. 90" />
                  </Row>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ap-text-muted)', margin: '0.25rem 0' }}>
                    Second-tier / additional bonus (optional).
                  </div>
                  <Row cols={3}>
                    <F label="Additional Bonus Amount" type="number" value={cardForm.additionalBonusAmount}
                      onChange={v => set('additionalBonusAmount', v)} />
                    <F label="Additional Bonus Spend (SAR)" type="number" value={cardForm.additionalBonusSpend}
                      onChange={v => set('additionalBonusSpend', v)} />
                    <F label="Additional Bonus Days" type="number" value={cardForm.additionalBonusDays}
                      onChange={v => set('additionalBonusDays', v)} />
                  </Row>
                  <Row>
                    <F label="Renewal Bonus Amount" type="number" value={cardForm.renewalBonusAmount}
                      onChange={v => set('renewalBonusAmount', v)} placeholder="Points/miles on renewal" />
                    <div /> {/* spacer */}
                  </Row>
                  <TA label="Bonus Notes" rows={3} value={cardForm.bonusNotes} onChange={v => set('bonusNotes', v)}
                    placeholder="e.g. Additional 5,000 pts every quarter if 10,000 SAR spent" />
                </CardSection>

                {/* ─────────────────────────────────────────────
                    3. EARN RATES — Points / Miles only
                   ───────────────────────────────────────────── */}
                {isPointsMiles && (
                  <CardSection title="③ Earn Rates (Points / Miles)" defaultOpen accent>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ap-text-muted)', marginBottom: '0.25rem' }}>
                      Enter SAR per point/mile (e.g. 3 = 1 mile per 3 SAR spent).
                    </div>
                    <Row cols={3}>
                      <F label="Domestic Earn Rate" type="number" step="0.01" value={cardForm.domesticEarnRate}
                        onChange={v => set('domesticEarnRate', v)} placeholder="e.g. 3" />
                      <F label="International Earn Rate" type="number" step="0.01" value={cardForm.internationalEarnRate}
                        onChange={v => set('internationalEarnRate', v)} placeholder="e.g. 2" />
                      <F label="Airline Spend Earn Rate" type="number" step="0.01" value={cardForm.airlineSpendEarnRate}
                        onChange={v => set('airlineSpendEarnRate', v)} placeholder="e.g. 1.5" />
                    </Row>
                  </CardSection>
                )}

                {/* ─────────────────────────────────────────────
                    4. CASHBACK RATES & CAPS — Cashback only
                   ───────────────────────────────────────────── */}
                {isCashback && (
                  <CardSection title="④ Cashback Rates & Caps" defaultOpen accent>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ap-text-muted)', marginBottom: '0.25rem' }}>
                      Per-category cashback percentage and monthly SAR cap.
                    </div>
                    <RateCapRow label="Dining"               rateKey="cashbackDiningPct"     capKey="cashbackDiningCap"     form={cardForm} set={set} />
                    <RateCapRow label="Groceries"            rateKey="cashbackGroceriesPct"  capKey="cashbackGroceriesCap"  form={cardForm} set={set} />
                    <RateCapRow label="Online Shopping"      rateKey="cashbackOnlinePct"     capKey="cashbackOnlineCap"     form={cardForm} set={set} />
                    <RateCapRow label="Other International"  rateKey="cashbackIntlOtherPct"  capKey="cashbackIntlOtherCap"  form={cardForm} set={set} />
                    <RateCapRow label="Other Local"          rateKey="cashbackLocalOtherPct" capKey="cashbackLocalOtherCap" form={cardForm} set={set} />
                    <Row>
                      <F label="Total Monthly Cashback Cap (SAR)" type="number" value={cardForm.cashbackTotalMonthlyCap}
                        onChange={v => set('cashbackTotalMonthlyCap', v)} placeholder="e.g. 500" />
                      <div />
                    </Row>
                  </CardSection>
                )}

                {/* ─────────────────────────────────────────────
                    5. TASAHEEL (0% Installments)
                   ───────────────────────────────────────────── */}
                <CardSection title="⑤ Tasaheel — 0% Installment Program">
                  <Row>
                    <div>
                      <Toggle label="Tasaheel Available (0% installments)" checked={cardForm.tasaheelAvailable}
                        onChange={v => set('tasaheelAvailable', v)} />
                    </div>
                    <F label="Max Installment Months" type="number" value={cardForm.maxInstallmentMonths}
                      onChange={v => set('maxInstallmentMonths', v)} placeholder="e.g. 36" />
                  </Row>
                </CardSection>

                {/* ─────────────────────────────────────────────
                    6. FEES
                   ───────────────────────────────────────────── */}
                <CardSection title="⑥ Fees">
                  <Row>
                    <F label="Supplementary Card Fee (SAR)" type="number" value={cardForm.suppCardFee}
                      onChange={v => set('suppCardFee', v)} placeholder="e.g. 100" />
                    <F label="Free Supplementary Cards" type="number" value={cardForm.freeSuppCards}
                      onChange={v => set('freeSuppCards', v)} placeholder="e.g. 1" />
                  </Row>
                  <Row cols={3}>
                    <F label="Cash Withdrawal Fee %" type="number" step="0.1" value={cardForm.cashWithdrawalFeePct}
                      onChange={v => set('cashWithdrawalFeePct', v)} placeholder="e.g. 3.0" />
                    <F label="Cash Withdrawal Min Fee" type="number" value={cardForm.cashWithdrawalMinFee}
                      onChange={v => set('cashWithdrawalMinFee', v)} placeholder="e.g. 50" />
                    <F label="Cash Withdrawal Max Fee" type="number" value={cardForm.cashWithdrawalMaxFee}
                      onChange={v => set('cashWithdrawalMaxFee', v)} placeholder="e.g. 500" />
                  </Row>
                  <Row cols={3}>
                    <F label="Replacement Card Fee" type="number" value={cardForm.replacementCardFee}
                      onChange={v => set('replacementCardFee', v)} placeholder="e.g. 100" />
                    <F label="Wrong Dispute Fee" type="number" value={cardForm.wrongDisputeFee}
                      onChange={v => set('wrongDisputeFee', v)} placeholder="e.g. 100" />
                    <F label="ATM Inquiry Fee" type="number" value={cardForm.atmInquiryFee}
                      onChange={v => set('atmInquiryFee', v)} placeholder="e.g. 2" />
                  </Row>
                </CardSection>

                {/* ─────────────────────────────────────────────
                    7. PAYMENT TERMS
                   ───────────────────────────────────────────── */}
                <CardSection title="⑦ Payment Terms">
                  <Row cols={3}>
                    <F label="Monthly Profit Rate %" type="number" step="0.01" value={cardForm.monthlyProfitRatePct}
                      onChange={v => set('monthlyProfitRatePct', v)} placeholder="e.g. 2.99" />
                    <F label="Minimum Payment %" type="number" value={cardForm.minPaymentPct}
                      onChange={v => set('minPaymentPct', v)} placeholder="e.g. 5" />
                    <F label="Minimum Payment Fixed (SAR)" type="number" value={cardForm.minPaymentFixed}
                      onChange={v => set('minPaymentFixed', v)} placeholder="e.g. 100" />
                  </Row>
                </CardSection>

                {/* ─────────────────────────────────────────────
                    8. BENEFITS (checkboxes)
                   ───────────────────────────────────────────── */}
                <CardSection title="⑧ Benefits" defaultOpen>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <Toggle label="Travel Insurance"     checked={cardForm.hasTravelInsurance}    onChange={v => set('hasTravelInsurance', v)} />
                    <Toggle label="Purchase Protection"  checked={cardForm.hasPurchaseProtection} onChange={v => set('hasPurchaseProtection', v)} />
                    <Toggle label="Apple Pay"            checked={cardForm.hasApplePay}           onChange={v => set('hasApplePay', v)} />
                    <Toggle label="Google Pay"           checked={cardForm.hasGooglePay}          onChange={v => set('hasGooglePay', v)} />
                    <Toggle label="Samsung Pay"          checked={cardForm.hasSamsungPay}         onChange={v => set('hasSamsungPay', v)} />
                    <Toggle label="Concierge Service"    checked={cardForm.hasConcierge}          onChange={v => set('hasConcierge', v)} />
                    <Toggle label="Extended Warranty"    checked={cardForm.hasExtendedWarranty}   onChange={v => set('hasExtendedWarranty', v)} />
                  </div>
                </CardSection>

                {/* ─────────────────────────────────────────────
                    9. REQUIRED DOCUMENTS
                   ───────────────────────────────────────────── */}
                <CardSection title="⑨ Required Documents">
                  <TA label="Required Documents" rows={4} value={cardForm.requiredDocuments}
                    onChange={v => set('requiredDocuments', v)}
                    placeholder={'e.g.\n- National ID\n- Salary certificate\n- Last 3 months bank statements'} />
                </CardSection>

                {/* ─────────────────────────────────────────────
                    TRANSLATIONS (description + benefits)
                   ───────────────────────────────────────────── */}
                <CardSection title="Translations — Description & Benefits">
                  <TA label="Description (EN)" rows={3} value={cardForm.description_en} onChange={v => set('description_en', v)} />
                  <TA label="Description (AR)" rows={3} value={cardForm.description_ar} onChange={v => set('description_ar', v)} dir="rtl" />
                  <TA label="Benefits (EN)" rows={3} value={cardForm.benefits_en} onChange={v => set('benefits_en', v)} />
                  <TA label="Benefits (AR)" rows={3} value={cardForm.benefits_ar} onChange={v => set('benefits_ar', v)} dir="rtl" />
                </CardSection>

                {/* ─────────────────────────────────────────────
                    LEGACY CASHBACK (scoring engine back-compat)
                    Hidden behind collapsed section — only visible
                    when you need to populate old scoring weights.
                   ───────────────────────────────────────────── */}
                <CardSection title="Legacy Cashback Fields (Scoring Engine)">
                  <div style={{ fontSize: '0.72rem', color: 'var(--ap-text-muted)', marginBottom: '0.5rem' }}>
                    These legacy per-category floats feed BankNicheSnapshot scoring. Use the structured fields above for display; these are for the scoring engine only.
                  </div>
                  <Row cols={3}>
                    <F label="General %"    type="number" step="0.1" value={cardForm.cashbackGeneral}    onChange={v => set('cashbackGeneral', v)} />
                    <F label="Travel %"     type="number" step="0.1" value={cardForm.cashbackTravel}     onChange={v => set('cashbackTravel', v)} />
                    <F label="Dining %"     type="number" step="0.1" value={cardForm.cashbackDining}     onChange={v => set('cashbackDining', v)} />
                  </Row>
                  <Row cols={3}>
                    <F label="Shopping %"   type="number" step="0.1" value={cardForm.cashbackShopping}   onChange={v => set('cashbackShopping', v)} />
                    <F label="Fuel %"       type="number" step="0.1" value={cardForm.cashbackFuel}       onChange={v => set('cashbackFuel', v)} />
                    <F label="Gaming %"     type="number" step="0.1" value={cardForm.cashbackGaming}     onChange={v => set('cashbackGaming', v)} />
                  </Row>
                  <Row cols={3}>
                    <F label="Groceries %"  type="number" step="0.1" value={cardForm.cashbackGroceries}  onChange={v => set('cashbackGroceries', v)} />
                    <F label="Online %"     type="number" step="0.1" value={cardForm.cashbackOnline}     onChange={v => set('cashbackOnline', v)} />
                    <F label="Healthcare %" type="number" step="0.1" value={cardForm.cashbackHealthcare} onChange={v => set('cashbackHealthcare', v)} />
                  </Row>
                </CardSection>

                {/* Submit */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button type="submit" className="ap-btn ap-btn--primary ap-btn--sm" disabled={savingCard}>
                    {savingCard ? 'Saving…' : editCardId ? 'Save Changes' : 'Create Card'}
                  </button>
                  <button type="button" className="ap-btn ap-btn--sm"
                    onClick={() => setShowCardForm(false)}
                    style={{ background: 'transparent', border: '1px solid var(--ap-border)' }}>
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* ── Card list ── */}
          {cards.length === 0 && !showCardForm && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ap-text-muted)', fontSize: '0.82rem', border: '1px dashed var(--ap-border)', borderRadius: 8 }}>
              No cards yet. Click &ldquo;+ Add Card&rdquo; to create the first one.
            </div>
          )}

          {cards.map(c => {
            const en = c.translations?.find(t => t.locale === 'en') || {};
            return (
              <div key={c.id} className="ap-card"
                style={{ padding: '0.875rem 1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {c.image && (
                  <img src={c.image} alt="" style={{ width: 56, height: 36, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--ap-border)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ap-text-primary)' }}>
                    {en.name || `Card #${c.id}`}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ap-text-muted)', marginTop: 2 }}>
                    {c.network} · {c.tier}{c.isIslamic ? ' · Islamic' : ''}
                    {c.annualFee != null ? ` · ${c.annualFee} SAR/yr` : ''}
                    {c.rewardProgramName ? ` · ${c.rewardProgramName}` : ''}
                    {c.rewardType ? ` (${c.rewardType})` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button className="ap-btn ap-btn--sm" type="button" onClick={() => openEditCard(c)}
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>Edit</button>
                  <button className="ap-btn ap-btn--sm" type="button" onClick={() => deleteCard(c.id)}
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          NICHE SCORES TAB
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'Niche Scores' && (
        <div>
          {niches.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ap-text-muted)', fontSize: '0.82rem', border: '1px dashed var(--ap-border)', borderRadius: 8 }}>
              No scoring niches configured. Add <code>bankScoringWeights</code> to a Category to create niches.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {niches.map(niche => {
                const weights = niche.bankScoringWeights || {};
                const data = Object.entries(weights).map(([key, w]) => ({
                  label: key.replace(/([A-Z])/g, ' $1').trim().slice(0, 8),
                  value: Math.round(w * 100),
                }));
                return (
                  <div key={niche.id} className="ap-card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ap-text-primary)', marginBottom: '0.5rem' }}>
                      {niche.translations?.[0]?.name || niche.slug}
                    </div>
                    <RadarChart data={data} size={180} />
                    <div style={{ fontSize: '0.68rem', color: 'var(--ap-text-muted)', marginTop: '0.5rem' }}>
                      {Object.keys(weights).length} criteria
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
