// app/admin/blog/[id]/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../admin.module.css';
import RichTextEditor from '@/components/admin/RichTextEditor/RichTextEditor';

// ─────────────────────────────────────────────────────────────────────────────
// Constants from schema enums
// ─────────────────────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { value: 'GUIDE',      label: 'Guide' },
  { value: 'DEAL_HUB',   label: 'Deal Hub' },
  { value: 'SEASONAL',   label: 'Seasonal' },
  { value: 'COMPARISON', label: 'Comparison' },
  { value: 'NEWS',       label: 'News' },
];

const SEARCH_INTENTS = [
  { value: 'INFORMATIONAL',  label: 'Informational' },
  { value: 'COMMERCIAL',     label: 'Commercial' },
  { value: 'TRANSACTIONAL',  label: 'Transactional' },
];

const STATUSES = [
  { value: 'DRAFT',     label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED',  label: 'Archived' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div className={styles.formGroup}>
      {label && <label style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--admin-text)' }}>{label}</label>}
      {children}
      {hint && <p className={styles.helpText}>{hint}</p>}
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.formSection}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <h3 className={styles.formSectionTitle} style={{ marginBottom: 0, borderBottom: 'none' }}>{title}</h3>
        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ marginTop: '1rem', borderTop: '1px solid var(--admin-border-light)', paddingTop: '1rem' }}>{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sections manager — uses RichTextEditor for section content fields
// ─────────────────────────────────────────────────────────────────────────────
function SectionsManager({ postId, initial = [] }) {
  const [sections,   setSections]   = useState(initial);
  const [adding,     setAdding]     = useState(false);
  const [newSection, setNewSection] = useState({ subtitleEn: '', subtitleAr: '', contentEn: '', contentAr: '', image: '' });
  const [saving,     setSaving]     = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [editForm,   setEditForm]   = useState({});

  async function handleAdd() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}/sections`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(newSection),
      });
      const data = await res.json();
      if (data.id) {
        setSections(prev => [...prev, {
          ...data,
          translations: [
            { locale: 'en', subtitle: newSection.subtitleEn, content: newSection.contentEn },
            { locale: 'ar', subtitle: newSection.subtitleAr, content: newSection.contentAr },
          ],
        }]);
        setNewSection({ subtitleEn: '', subtitleAr: '', contentEn: '', contentAr: '', image: '' });
        setAdding(false);
      }
    } finally { setSaving(false); }
  }

  async function handleUpdate(sectionId) {
    setSaving(true);
    try {
      await fetch(`/api/admin/blog/${postId}/sections/${sectionId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(editForm),
      });
      setSections(prev => prev.map(s => s.id === sectionId ? {
        ...s,
        image: editForm.image,
        translations: [
          { locale: 'en', subtitle: editForm.subtitleEn, content: editForm.contentEn },
          { locale: 'ar', subtitle: editForm.subtitleAr, content: editForm.contentAr },
        ],
      } : s));
      setEditingId(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(sectionId) {
    if (!confirm('Delete this section?')) return;
    await fetch(`/api/admin/blog/${postId}/sections/${sectionId}`, { method: 'DELETE' });
    setSections(prev => prev.filter(s => s.id !== sectionId));
  }

  return (
    <div>
      {sections.length === 0 && (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          No sections yet. Sections are structured content blocks that appear below the main article body.
        </p>
      )}

      {sections.map((sec, idx) => {
        const tEn      = sec.translations?.find(t => t.locale === 'en') || {};
        const tAr      = sec.translations?.find(t => t.locale === 'ar') || {};
        const isEditing = editingId === sec.id;

        return (
          <div key={sec.id} className={styles.card} style={{ marginBottom: '0.75rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditing ? '1rem' : 0 }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                Section {idx + 1} {tEn.subtitle ? `— ${tEn.subtitle}` : ''}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={styles.btnEdit}
                  onClick={() => {
                    setEditingId(isEditing ? null : sec.id);
                    setEditForm({
                      subtitleEn: tEn.subtitle || '',
                      subtitleAr: tAr.subtitle || '',
                      contentEn:  tEn.content  || '',
                      contentAr:  tAr.content  || '',
                      image:      sec.image    || '',
                    });
                  }}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                <button type="button" className={styles.btnDelete} onClick={() => handleDelete(sec.id)}>Delete</button>
              </div>
            </div>

            {isEditing && (
              <div>
                <div className={styles.formRow}>
                  <Field label="Subtitle (EN)">
                    <input className={styles.formInput} value={editForm.subtitleEn || ''} onChange={e => setEditForm(f => ({ ...f, subtitleEn: e.target.value }))} />
                  </Field>
                  <Field label="Subtitle (AR)">
                    <input className={styles.formInput} dir="rtl" value={editForm.subtitleAr || ''} onChange={e => setEditForm(f => ({ ...f, subtitleAr: e.target.value }))} />
                  </Field>
                </div>

                <Field label="Content (EN)">
                  <RichTextEditor
                    value={editForm.contentEn || ''}
                    onChange={v => setEditForm(f => ({ ...f, contentEn: v }))}
                    dir="ltr"
                    minHeight="200px"
                  />
                </Field>

                <Field label="Content (AR)">
                  <RichTextEditor
                    value={editForm.contentAr || ''}
                    onChange={v => setEditForm(f => ({ ...f, contentAr: v }))}
                    dir="rtl"
                    minHeight="200px"
                  />
                </Field>

                <Field label="Section image URL">
                  <input className={styles.formInput} value={editForm.image || ''} onChange={e => setEditForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
                </Field>

                <div style={{ marginTop: '0.75rem' }}>
                  <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => handleUpdate(sec.id)}>
                    {saving ? 'Saving…' : 'Save Section'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className={styles.card} style={{ marginBottom: '0.75rem', padding: '1rem', borderColor: 'var(--admin-primary)' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>New Section</h4>

          <div className={styles.formRow}>
            <Field label="Subtitle (EN)">
              <input className={styles.formInput} value={newSection.subtitleEn} onChange={e => setNewSection(f => ({ ...f, subtitleEn: e.target.value }))} />
            </Field>
            <Field label="Subtitle (AR)">
              <input className={styles.formInput} dir="rtl" value={newSection.subtitleAr} onChange={e => setNewSection(f => ({ ...f, subtitleAr: e.target.value }))} />
            </Field>
          </div>

          <Field label="Content (EN)">
            <RichTextEditor
              value={newSection.contentEn}
              onChange={v => setNewSection(f => ({ ...f, contentEn: v }))}
              dir="ltr"
              minHeight="200px"
            />
          </Field>

          <Field label="Content (AR)">
            <RichTextEditor
              value={newSection.contentAr}
              onChange={v => setNewSection(f => ({ ...f, contentAr: v }))}
              dir="rtl"
              minHeight="200px"
            />
          </Field>

          <Field label="Image URL">
            <input className={styles.formInput} value={newSection.image} onChange={e => setNewSection(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
          </Field>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button type="button" className={styles.btnPrimary} disabled={saving} onClick={handleAdd}>{saving ? 'Adding…' : 'Add Section'}</button>
            <button type="button" className={styles.btnSecondary} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.btnSecondary} onClick={() => setAdding(true)} style={{ marginTop: '0.5rem' }}>
          + Add Section
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Store multi-select
// ─────────────────────────────────────────────────────────────────────────────
function StoreSelector({ label, selected, onChange }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/stores?locale=en&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data.slice(0, 10) : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  function add(store) {
    if (selected.find(s => s.id === store.id)) return;
    const name = store.translations?.find(t => t.locale === 'en')?.name || `Store #${store.id}`;
    onChange([...selected, { id: store.id, name }]);
    setQuery(''); setResults([]);
  }
  function remove(id) { onChange(selected.filter(s => s.id !== id)); }

  return (
    <Field label={label}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {selected.map(s => (
          <span key={s.id} style={{ background: 'var(--admin-primary-light)', color: 'var(--admin-primary)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {s.name}
            <button type="button" onClick={() => remove(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <input className={styles.formInput} placeholder="Search stores…" value={query} onChange={e => setQuery(e.target.value)} />
      {loading && <p className={styles.helpText}>Searching…</p>}
      {results.length > 0 && (
        <div style={{ border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', overflow: 'hidden', marginTop: '0.25rem' }}>
          {results.map(store => {
            const name = store.translations?.find(t => t.locale === 'en')?.name || `Store #${store.id}`;
            return (
              <button key={store.id} type="button" onClick={() => add(store)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: '1px solid var(--admin-border-light)', cursor: 'pointer', fontSize: '0.85rem' }}>
                {name}
              </button>
            );
          })}
        </div>
      )}
    </Field>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Post multi-select
// ─────────────────────────────────────────────────────────────────────────────
function PostSelector({ label, selected, onChange, excludeId }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const res  = await fetch(`/api/admin/blog?locale=en`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(
          data
            .filter(p => p.id !== excludeId && !selected.find(s => s.id === p.id))
            .filter(p => {
              const title = p.translations?.[0]?.title || '';
              return title.toLowerCase().includes(query.toLowerCase()) || p.slug.includes(query.toLowerCase());
            })
            .slice(0, 8)
        );
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, excludeId]);

  function add(post) {
    const title = post.translations?.[0]?.title || post.slug;
    onChange([...selected, { id: post.id, title }]);
    setQuery(''); setResults([]);
  }
  function remove(id) { onChange(selected.filter(s => s.id !== id)); }

  return (
    <Field label={label}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {selected.map(s => (
          <span key={s.id} style={{ background: '#f0fdf4', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {s.title}
            <button type="button" onClick={() => remove(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <input className={styles.formInput} placeholder="Search posts…" value={query} onChange={e => setQuery(e.target.value)} />
      {results.length > 0 && (
        <div style={{ border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', overflow: 'hidden', marginTop: '0.25rem' }}>
          {results.map(post => {
            const title = post.translations?.[0]?.title || post.slug;
            return (
              <button key={post.id} type="button" onClick={() => add(post)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: '1px solid var(--admin-border-light)', cursor: 'pointer', fontSize: '0.85rem' }}>
                {title} <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>#{post.id}</span>
              </button>
            );
          })}
        </div>
      )}
    </Field>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ editor
// ─────────────────────────────────────────────────────────────────────────────
function FaqEditor({ value, onChange }) {
  const [items, setItems] = useState(() => {
    try { return value ? JSON.parse(value) : []; } catch { return []; }
  });

  function sync(newItems) {
    setItems(newItems);
    onChange(newItems.length ? JSON.stringify(newItems) : '');
  }
  function add()           { sync([...items, { q: '', a: '' }]); }
  function remove(i)       { sync(items.filter((_, idx) => idx !== i)); }
  function update(i, k, v) { const next = items.map((it, idx) => idx === i ? { ...it, [k]: v } : it); sync(next); }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className={styles.card} style={{ padding: '0.875rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--admin-text-light)' }}>FAQ #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className={styles.btnDelete} style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>Remove</button>
          </div>
          <Field label="Question">
            <input className={styles.formInput} value={item.q} onChange={e => update(i, 'q', e.target.value)} placeholder="Question text…" />
          </Field>
          <Field label="Answer">
            <textarea className={styles.formTextarea} rows={3} value={item.a} onChange={e => update(i, 'a', e.target.value)} placeholder="Answer text…" />
          </Field>
        </div>
      ))}
      <button type="button" className={styles.btnSecondary} onClick={add} style={{ marginTop: '0.25rem', fontSize: '0.82rem' }}>+ Add FAQ Item</button>
      <p className={styles.helpText}>FAQ items are emitted as FAQPage structured data (schema.org) on the blog post page.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main editor page
// ─────────────────────────────────────────────────────────────────────────────
export default function EditBlogPostPage() {
  const { id } = useParams();
  const router = useRouter();

  const [post,       setPost]       = useState(null);
  const [authors,    setAuthors]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags,       setTags]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [alert,      setAlert]      = useState(null);

  const [form, setForm] = useState({
    slug: '', featuredImage: '', isFeatured: false,
    status: 'DRAFT', publishedAt: '',
    contentType: 'GUIDE', searchIntent: 'INFORMATIONAL',
    faqJson: '',
    authorId: '', categoryId: '', primaryStoreId: '',
    title_en: '', excerpt_en: '', content_en: '', metaTitle_en: '', metaDescription_en: '',
    title_ar: '', excerpt_ar: '', content_ar: '', metaTitle_ar: '', metaDescription_ar: '',
  });

  const [activeTags,        setActiveTags]        = useState(new Set());
  const [linkedStores,      setLinkedStores]      = useState([]);
  const [relatedPosts,      setRelatedPosts]      = useState([]);
  const [primaryStoreName,  setPrimaryStoreName]  = useState('');

  function flash(type, msg) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  useEffect(() => {
    async function load() {
      try {
        const [postRes, authorsRes, catsRes, tagsRes] = await Promise.all([
          fetch(`/api/admin/blog/${id}?locale=en`),
          fetch('/api/admin/blog/authors?locale=en'),
          fetch('/api/admin/categories?locale=en'),
          fetch('/api/admin/blog/tags?locale=en'),
        ]);

        const p = await postRes.json();
        setPost(p);

        const tEn = p.translations?.find(t => t.locale === 'en') || {};
        const tAr = p.translations?.find(t => t.locale === 'ar') || {};

        setForm({
          slug:           p.slug           || '',
          featuredImage:  p.featuredImage  || '',
          isFeatured:     p.isFeatured     || false,
          status:         p.status         || 'DRAFT',
          publishedAt:    p.publishedAt    ? new Date(p.publishedAt).toISOString().slice(0, 16) : '',
          contentType:    p.contentType    || 'GUIDE',
          searchIntent:   p.searchIntent   || 'INFORMATIONAL',
          faqJson:        p.faqJson        || '',
          authorId:       p.authorId       ? String(p.authorId)       : '',
          categoryId:     p.categoryId     ? String(p.categoryId)     : '',
          primaryStoreId: p.primaryStoreId ? String(p.primaryStoreId) : '',
          title_en:           tEn.title           || '',
          excerpt_en:         tEn.excerpt         || '',
          content_en:         tEn.content         || '',
          metaTitle_en:       tEn.metaTitle       || '',
          metaDescription_en: tEn.metaDescription || '',
          title_ar:           tAr.title           || '',
          excerpt_ar:         tAr.excerpt         || '',
          content_ar:         tAr.content         || '',
          metaTitle_ar:       tAr.metaTitle       || '',
          metaDescription_ar: tAr.metaDescription || '',
        });

        setActiveTags(new Set(p.tags?.map(pt => pt.tag.slug) || []));
        setLinkedStores(p.linkedStores?.map(ls => ({
          id:   ls.store.id,
          name: ls.store.translations?.[0]?.name || `Store #${ls.store.id}`,
        })) || []);
        setRelatedPosts(p.relatedPosts?.map(rp => ({
          id:    rp.relatedPost.id,
          title: rp.relatedPost.translations?.[0]?.title || rp.relatedPost.slug || `Post #${rp.relatedPost.id}`,
        })) || []);
        if (p.primaryStore) setPrimaryStoreName(p.primaryStore.translations?.[0]?.name || `Store #${p.primaryStoreId}`);

        const authorsData = await authorsRes.json();
        setAuthors(Array.isArray(authorsData) ? authorsData : []);
        const catsData = await catsRes.json();
        setCategories(Array.isArray(catsData) ? catsData : []);
        const tagsData = await tagsRes.json();
        setTags(Array.isArray(tagsData) ? tagsData : []);
      } catch (e) {
        flash('error', 'Failed to load post: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        slug:          form.slug,
        featuredImage: form.featuredImage || null,
        isFeatured:    form.isFeatured,
        status:        form.status,
        publishedAt:   form.publishedAt || null,
        contentType:   form.contentType,
        searchIntent:  form.searchIntent,
        faqJson:       form.faqJson || null,
        authorId:       form.authorId       ? parseInt(form.authorId)       : null,
        categoryId:     form.categoryId     ? parseInt(form.categoryId)     : null,
        primaryStoreId: form.primaryStoreId ? parseInt(form.primaryStoreId) : null,
        translations: {
          en: { title: form.title_en, excerpt: form.excerpt_en, content: form.content_en, metaTitle: form.metaTitle_en || null, metaDescription: form.metaDescription_en || null },
          ar: { title: form.title_ar, excerpt: form.excerpt_ar, content: form.content_ar, metaTitle: form.metaTitle_ar || null, metaDescription: form.metaDescription_ar || null },
        },
        tagIds:         tags.filter(t => activeTags.has(t.slug)).map(t => t.id),
        linkedStoreIds: linkedStores.map(s => s.id),
        relatedPostIds: relatedPosts.map(p => p.id),
      };

      const res  = await fetch(`/api/admin/blog/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      flash('success', 'Post saved successfully.');
    } catch (e) {
      flash('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post permanently? This cannot be undone.')) return;
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    router.push('/admin/blog');
  }

  function toggleTag(slug) {
    setActiveTags(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  if (loading) return <div className={styles.page}><div className={styles.loading}>Loading post…</div></div>;
  if (!post)   return <div className={styles.page}><div className={styles.errorCard}>Post not found</div></div>;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem' }}>Edit Post #{post.id}</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
            slug: <code style={{ background: 'var(--admin-bg)', padding: '0.1rem 0.35rem', borderRadius: 3 }}>{post.slug}</code>
            {' · '}reading time: {post.readingTime ?? '—'} min
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href={`/ar-SA/blog/${post.slug}`} target="_blank" className={styles.btnSecondary}>Preview →</Link>
          <button type="button" className={styles.btnSecondary} onClick={handleDelete} style={{ color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)' }}>Delete</button>
          <button type="button" className={styles.btnPrimary} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* ── Alert ── */}
      {alert && (
        <div className={alert.type === 'success' ? styles.alertSuccess : styles.errorMessage} style={{ marginBottom: '1rem' }}>
          {alert.msg}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div>

          {/* English Content */}
          <Section title="English Content">
            <Field label="Title (EN) *">
              <input className={styles.formInput} value={form.title_en} onChange={e => set('title_en', e.target.value)} />
            </Field>
            <Field label="Excerpt (EN) *" hint="Shown on listing cards and meta description fallback.">
              <textarea className={styles.formTextarea} rows={3} value={form.excerpt_en} onChange={e => set('excerpt_en', e.target.value)} />
            </Field>
            <Field label="Content (EN)">
              <RichTextEditor
                value={form.content_en}
                onChange={v => set('content_en', v)}
                dir="ltr"
                placeholder="Write your English content here…"
                minHeight="400px"
              />
            </Field>
            <div className={styles.formRow}>
              <Field label="Meta Title (EN)">
                <input className={styles.formInput} value={form.metaTitle_en} onChange={e => set('metaTitle_en', e.target.value)} />
              </Field>
              <Field label="Meta Description (EN)">
                <input className={styles.formInput} value={form.metaDescription_en} onChange={e => set('metaDescription_en', e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Arabic Content */}
          <Section title="Arabic Content — المحتوى العربي">
            <Field label="العنوان (AR) *">
              <input className={styles.formInput} dir="rtl" value={form.title_ar} onChange={e => set('title_ar', e.target.value)} />
            </Field>
            <Field label="الملخص (AR) *">
              <textarea className={styles.formTextarea} rows={3} dir="rtl" value={form.excerpt_ar} onChange={e => set('excerpt_ar', e.target.value)} />
            </Field>
            <Field label="المحتوى (AR)">
              <RichTextEditor
                value={form.content_ar}
                onChange={v => set('content_ar', v)}
                dir="rtl"
                placeholder="اكتب محتواك باللغة العربية هنا…"
                minHeight="400px"
              />
            </Field>
            <div className={styles.formRow}>
              <Field label="عنوان SEO (AR)">
                <input className={styles.formInput} dir="rtl" value={form.metaTitle_ar} onChange={e => set('metaTitle_ar', e.target.value)} />
              </Field>
              <Field label="وصف SEO (AR)">
                <input className={styles.formInput} dir="rtl" value={form.metaDescription_ar} onChange={e => set('metaDescription_ar', e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Structured Sections */}
          <Section title="Content Sections" defaultOpen={false}>
            <p className={styles.helpText} style={{ marginBottom: '0.75rem' }}>
              Sections are additional structured content blocks rendered below the main article body. Each has its own subtitle, body, and optional image.
            </p>
            <SectionsManager postId={id} initial={post.sections || []} />
          </Section>

          {/* FAQ */}
          <Section title="FAQ Schema" defaultOpen={false}>
            <FaqEditor value={form.faqJson} onChange={v => set('faqJson', v)} />
          </Section>

          {/* Relations */}
          <Section title="Linked Stores" defaultOpen={false}>
            <StoreSelector
              label='Stores mentioned in this article ("Stores in this article" sidebar)'
              selected={linkedStores}
              onChange={setLinkedStores}
            />
          </Section>

          <Section title="Related Posts" defaultOpen={false}>
            <PostSelector
              label="Editorial related posts (shown at article bottom)"
              selected={relatedPosts}
              onChange={setRelatedPosts}
              excludeId={post.id}
            />
          </Section>

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div>

          <div className={styles.formSection} style={{ marginBottom: '1rem' }}>
            <h3 className={styles.formSectionTitle}>Publish</h3>
            <Field label="Status">
              <select className={styles.formSelect} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Published At">
              <input type="datetime-local" className={styles.formInput} value={form.publishedAt} onChange={e => set('publishedAt', e.target.value)} />
            </Field>
            <div className={styles.checkboxWrapper} style={{ marginTop: '0.5rem' }}>
              <input type="checkbox" id="isFeatured" className={styles.formCheckbox} checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />
              <label htmlFor="isFeatured" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Featured post ★</label>
            </div>
            <button type="button" className={styles.btnPrimary} disabled={saving} onClick={handleSave} style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}>
              {saving ? 'Saving…' : 'Save All Changes'}
            </button>
          </div>

          <div className={styles.formSection} style={{ marginBottom: '1rem' }}>
            <h3 className={styles.formSectionTitle}>Basics</h3>
            <Field label="Slug" hint="URL path — must be unique.">
              <input className={styles.formInput} value={form.slug} onChange={e => set('slug', e.target.value)} />
            </Field>
            <Field label="Featured Image URL">
              <input className={styles.formInput} value={form.featuredImage} onChange={e => set('featuredImage', e.target.value)} placeholder="https://cdn.cobonat.me/blog/…" />
            </Field>
            {form.featuredImage && (
              <img src={form.featuredImage} alt="" style={{ width: '100%', borderRadius: 'var(--admin-radius)', marginTop: '0.5rem', aspectRatio: '16/9', objectFit: 'cover' }} />
            )}
          </div>

          <div className={styles.formSection} style={{ marginBottom: '1rem' }}>
            <h3 className={styles.formSectionTitle}>SEO Strategy</h3>
            <Field label="Content Type" hint="Affects internal linking and category display.">
              <select className={styles.formSelect} value={form.contentType} onChange={e => set('contentType', e.target.value)}>
                {CONTENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Search Intent" hint="Primary user intent this post targets.">
              <select className={styles.formSelect} value={form.searchIntent} onChange={e => set('searchIntent', e.target.value)}>
                {SEARCH_INTENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          <div className={styles.formSection} style={{ marginBottom: '1rem' }}>
            <h3 className={styles.formSectionTitle}>Taxonomy</h3>
            <Field label="Author">
              <select className={styles.formSelect} value={form.authorId} onChange={e => set('authorId', e.target.value)}>
                <option value="">— No Author —</option>
                {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select className={styles.formSelect} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                <option value="">— No Category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.translations?.[0]?.name || c.slug}</option>)}
              </select>
            </Field>
            <Field label="Tags">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
                {tags.map(t => {
                  const active = activeTags.has(t.slug);
                  return (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => toggleTag(t.slug)}
                      style={{
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem',
                        border: '1px solid', cursor: 'pointer',
                        background:   active ? 'var(--admin-primary)' : 'transparent',
                        color:        active ? '#fff' : 'var(--admin-text-light)',
                        borderColor:  active ? 'var(--admin-primary)' : 'var(--admin-border)',
                      }}
                    >
                      {t.translations?.[0]?.name || t.slug}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <div className={styles.formSection} style={{ marginBottom: '1rem' }}>
            <h3 className={styles.formSectionTitle}>Merchant Cluster</h3>
            <Field label="Primary Store ID" hint="This post's main store. Used for store-page article listings and content clustering.">
              <input type="number" className={styles.formInput} value={form.primaryStoreId} onChange={e => set('primaryStoreId', e.target.value)} placeholder="e.g. 42" />
              {primaryStoreName && <p className={styles.helpText}>Currently: {primaryStoreName}</p>}
            </Field>
          </div>

        </div>
      </div>
    </div>
  );
}
