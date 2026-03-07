// app/admin/banks/niches/page.jsx
// Shows all Category rows where bankScoringWeights IS NOT NULL.
// Displays the latest BankNicheSnapshot scores per niche as a mini leaderboard.
// Weight editing links back to /admin/categories?edit=[id].
// "Recalculate Now" triggers POST /api/admin/bank-leaderboard/run.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../admin.module.css';

const MOVEMENT_ICON = { UP: '↑', DOWN: '↓', SAME: '→', NEW: '★' };
const MOVEMENT_COLOR = { UP: '#16a34a', DOWN: '#dc2626', SAME: '#64748b', NEW: '#7c3aed' };

function ScoreBar({ score }) {
  const pct  = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 34, textAlign: 'right' }}>
        {pct.toFixed(1)}
      </span>
    </div>
  );
}

export default function BankNichesPage() {
  const router = useRouter();

  const [niches,      setNiches]      = useState([]);   // Category rows with bankScoringWeights
  const [snapshots,   setSnapshots]   = useState({});   // { [categoryId]: BankNicheSnapshot[] }
  const [activeNiche, setActiveNiche] = useState(null); // categoryId currently expanded
  const [loading,     setLoading]     = useState(true);
  const [running,     setRunning]     = useState(false);
  const [runResult,   setRunResult]   = useState(null);

  // ── Load niches (categories with bankScoringWeights) ─────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/admin/categories?locale=en');
        const data = await res.json();
        const nicheCategories = (data || []).filter(
          c => c.bankScoringWeights && Object.keys(c.bankScoringWeights).length > 0
        );
        setNiches(nicheCategories);

        // Auto-expand first niche
        if (nicheCategories.length > 0) setActiveNiche(nicheCategories[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Load snapshots for a niche when it's expanded ─────────────────────────
  useEffect(() => {
    if (!activeNiche) return;
    if (snapshots[activeNiche]) return; // already loaded

    async function loadSnapshots() {
      try {
        const res  = await fetch(`/api/admin/bank-niches/${activeNiche}/snapshots`);
        const data = res.ok ? await res.json() : [];
        setSnapshots(prev => ({ ...prev, [activeNiche]: data }));
      } catch {
        setSnapshots(prev => ({ ...prev, [activeNiche]: [] }));
      }
    }
    loadSnapshots();
  }, [activeNiche]);

  // ── Run leaderboard calculation ───────────────────────────────────────────
  async function handleRecalculate() {
    setRunning(true);
    setRunResult(null);
    try {
      const res  = await fetch('/api/admin/bank-leaderboard/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      setRunResult(data);
      // Flush snapshot cache so they reload on next expand
      setSnapshots({});
    } catch (err) {
      setRunResult({ error: err.message });
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <div className={styles.page}>Loading…</div>;

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Bank Scoring Niches</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
            These are <strong>Category</strong> rows with scoring weights set.
            To add/edit weights go to{' '}
            <button onClick={() => router.push('/admin/categories')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', padding: 0, textDecoration: 'underline' }}>
              Admin → Categories
            </button>
            .
          </p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={running}
          className={styles.btnPrimary}
          style={{ minWidth: 160 }}
        >
          {running ? 'Calculating…' : '▶ Recalculate All'}
        </button>
      </div>

      {/* ── Run result banner ────────────────────────────────────────────────── */}
      {runResult && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem',
          background: runResult.error ? '#fee2e2' : '#dcfce7',
          border: `1px solid ${runResult.error ? '#fca5a5' : '#86efac'}`,
          color: runResult.error ? '#991b1b' : '#166534',
          fontSize: '0.82rem',
        }}>
          {runResult.error
            ? `Error: ${runResult.error}`
            : `✓ Week ${runResult.week} — ${runResult.banksProcessed} banks × ${runResult.nichesProcessed} niches → ${runResult.snapshotsUpserted} snapshots updated`}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {niches.length === 0 && (
        <div className={styles.emptyState} style={{ marginTop: '3rem' }}>
          <span className="material-symbols-sharp" style={{ fontSize: 48, color: '#d1d5db' }}>category</span>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>No bank scoring niches yet.</p>
          <button onClick={() => router.push('/admin/categories')} className={styles.btnPrimary} style={{ marginTop: '0.75rem' }}>
            Go to Categories
          </button>
        </div>
      )}

      {/* ── Niche accordion ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {niches.map(niche => {
          const en        = niche.translations?.find(t => t.locale === 'en') || {};
          const isOpen    = activeNiche === niche.id;
          const snaps     = snapshots[niche.id];
          const weights   = niche.bankScoringWeights || {};
          const criteria  = Object.keys(weights);

          return (
            <div key={niche.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
              {/* ── Niche header row ─────────────────────────────────────────── */}
              <button
                onClick={() => setActiveNiche(isOpen ? null : niche.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0.875rem 1.25rem', background: isOpen ? '#f8fafc' : '#fff',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderBottom: isOpen ? '1px solid #e2e8f0' : 'none',
                }}
              >
                {/* Icon + name */}
                <div style={{
                  width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: niche.color ? `${niche.color}18` : '#f1f5f9', flexShrink: 0,
                }}>
                  <span className="material-symbols-sharp" style={{ fontSize: 20, color: niche.color || '#64748b' }}>
                    {niche.icon}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{en.name || niche.id}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    {criteria.length} criteria · slug: {en.slug || '—'}
                  </div>
                </div>

                {/* Criteria pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 320, justifyContent: 'flex-end' }}>
                  {criteria.slice(0, 5).map(k => (
                    <span key={k} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                      {k} {(weights[k] * 100).toFixed(0)}%
                    </span>
                  ))}
                  {criteria.length > 5 && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: '#e0e7ff', color: '#4338ca', fontWeight: 600 }}>
                      +{criteria.length - 5} more
                    </span>
                  )}
                </div>

                {/* Edit link */}
                <button
                  onClick={e => { e.stopPropagation(); router.push(`/admin/categories?edit=${niche.id}`); }}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.75rem', color: '#374151', cursor: 'pointer', flexShrink: 0 }}
                >
                  Edit weights
                </button>

                <span className="material-symbols-sharp" style={{ fontSize: 18, color: '#94a3b8', flexShrink: 0 }}>
                  {isOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* ── Snapshot leaderboard ────────────────────────────────────── */}
              {isOpen && (
                <div style={{ padding: '1rem 1.25rem' }}>
                  {!snaps ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '1rem 0' }}>Loading scores…</div>
                  ) : snaps.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '1rem 0' }}>
                      No snapshots yet — click <strong>Recalculate All</strong> to generate scores.
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        Week: <strong>{snaps[0]?.weekIdentifier}</strong> · {snaps.length} banks scored
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                              <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600, width: 40 }}>#</th>
                              <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Bank</th>
                              <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Score</th>
                              <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600, width: 40 }}>Δ</th>
                              <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Top Criteria</th>
                            </tr>
                          </thead>
                          <tbody>
                            {snaps.map((snap, idx) => {
                              const breakdown = snap.scoreBreakdown || {};
                              const topCriteria = Object.entries(breakdown)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3);

                              return (
                                <tr key={snap.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                  <td style={{ padding: '8px', fontWeight: 700, color: idx < 3 ? ['#f59e0b','#94a3b8','#b45309'][idx] : '#64748b' }}>
                                    {snap.rank}
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    <div style={{ fontWeight: 600 }}>{snap.bank?.translations?.[0]?.name || snap.bank?.slug || `Bank #${snap.bankId}`}</div>
                                    {snap.bestCardId && (
                                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Card #{snap.bestCardId}</div>
                                    )}
                                  </td>
                                  <td style={{ padding: '8px', minWidth: 150 }}>
                                    <ScoreBar score={snap.score} />
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'center' }}>
                                    {snap.previousRank && snap.previousRank !== snap.rank ? (
                                      <span style={{ fontSize: 13, fontWeight: 700, color: MOVEMENT_COLOR[snap.movement] }}>
                                        {MOVEMENT_ICON[snap.movement]}
                                      </span>
                                    ) : (
                                      <span style={{ color: MOVEMENT_COLOR[snap.movement] || '#94a3b8', fontSize: 13 }}>
                                        {MOVEMENT_ICON[snap.movement] || '—'}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                      {topCriteria.map(([key, val]) => (
                                        <span key={key} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#f0fdf4', color: '#15803d', fontWeight: 600 }}>
                                          {key} {val.toFixed(1)}
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
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
