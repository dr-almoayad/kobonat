'use client';
// components/admin/RichTextEditor/NewPostContentFields.jsx
//
// Drop-in replacement for the two plain <textarea> content fields on
// app/admin/blog/new/page.jsx (a Server Component / server-action form).
//
// Each RichTextEditor renders a hidden <input name={...}> so the HTML
// is included in the native FormData submission — no extra wiring needed.

import RichTextEditor from './RichTextEditor';

function Label({ children }) {
  return (
    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--admin-text)' }}>
      {children}
    </label>
  );
}

export default function NewPostContentFields() {
  return (
    <>
      {/* ── English content ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Label>Content (EN)</Label>
        <RichTextEditor
          name="content_en"
          dir="ltr"
          placeholder="Write your English content here…"
          minHeight="380px"
        />
      </div>

      {/* ── Arabic content ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Label>المحتوى (AR)</Label>
        <RichTextEditor
          name="content_ar"
          dir="rtl"
          placeholder="اكتب محتواك باللغة العربية هنا…"
          minHeight="380px"
        />
      </div>
    </>
  );
}
