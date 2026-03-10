'use client';
// components/admin/RichTextEditor/RichTextEditor.jsx
//
// Tiptap v3 WYSIWYG editor for blog post content.
// Outputs HTML. Works for both controlled (edit page) and form-hidden-input
// (new page) patterns via the `name` prop.
//
// Props:
//   value       — HTML string (controlled)
//   onChange    — (html: string) => void — called on every change
//   name        — if set, renders a hidden <input name={name}> for native forms
//   dir         — 'ltr' | 'rtl'
//   placeholder — placeholder text when empty
//   minHeight   — editor body min-height, default '320px'

import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import './RichTextEditor.css';

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolbarBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`rte-btn${active ? ' rte-btn--active' : ''}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="rte-divider" />;
}

// ── Link popover ──────────────────────────────────────────────────────────────
// Shows an inline popover below the toolbar button to enter/edit/remove a URL.
function LinkPopover({ editor, onClose }) {
  const inputRef  = useRef(null);
  const isActive  = editor.isActive('link');
  const [url, setUrl] = useState(() => editor.getAttributes('link').href || '');

  // Focus the input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  function apply(e) {
    e.preventDefault();
    const href = url.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const fullHref = /^https?:\/\//i.test(href) ? href : `https://${href}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: fullHref, target: '_blank', rel: 'noopener noreferrer' }).run();
    }
    onClose();
  }

  function remove() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  }

  return (
    <div className="rte-link-popover" role="dialog" aria-label="Insert link">
      <form onSubmit={apply} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <span className="material-symbols-sharp" style={{ fontSize: '1rem', color: 'var(--admin-text-muted, #9ca3af)', flexShrink: 0 }}>link</span>
        <input
          ref={inputRef}
          className="rte-link-input"
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
          onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
        />
        <button type="submit" className="rte-link-apply">
          {url.trim() ? 'Apply' : 'Remove'}
        </button>
        {isActive && (
          <button type="button" className="rte-link-remove" onClick={remove} title="Remove link">
            <span className="material-symbols-sharp" style={{ fontSize: '0.9rem' }}>link_off</span>
          </button>
        )}
      </form>
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
function Toolbar({ editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const linkBtnRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    if (!linkOpen) return;
    function handleClick(e) {
      if (!linkBtnRef.current?.closest('.rte-link-wrapper')?.contains(e.target)) {
        setLinkOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [linkOpen]);

  if (!editor) return null;

  return (
    <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">

      {/* Headings */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} title="Heading 4">H4</ToolbarBtn>

      <Divider />

      {/* Inline marks */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}   active={editor.isActive('bold')}   title="Bold (Ctrl+B)"><b>B</b></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)"><i>I</i></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()}   active={editor.isActive('code')}   title="Inline code"><code>`c`</code></ToolbarBtn>

      {/* ── Link button + popover ── */}
      <div className="rte-link-wrapper" ref={linkBtnRef}>
        <ToolbarBtn
          onClick={() => setLinkOpen(v => !v)}
          active={editor.isActive('link') || linkOpen}
          title="Insert / edit link (Ctrl+K)"
        >
          <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>link</span>
        </ToolbarBtn>
        {linkOpen && (
          <LinkPopover editor={editor} onClose={() => setLinkOpen(false)} />
        )}
      </div>

      <Divider />

      {/* Lists */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Bullet list">
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>format_list_bulleted</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>format_list_numbered</span>
      </ToolbarBtn>

      <Divider />

      {/* Blocks */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}   active={editor.isActive('blockquote')} title="Blockquote">
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>format_quote</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()}    active={editor.isActive('codeBlock')}  title="Code block">
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>code</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()}  active={false}                         title="Horizontal rule">
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>horizontal_rule</span>
      </ToolbarBtn>

      <Divider />

      {/* History */}
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>undo</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>redo</span>
      </ToolbarBtn>

      <Divider />

      {/* Clear formatting */}
      <ToolbarBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} active={false} title="Clear all formatting">
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>format_clear</span>
      </ToolbarBtn>

    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RichTextEditor({
  value       = '',
  onChange,
  name,
  dir         = 'ltr',
  placeholder = 'Start writing…',
  minHeight   = '320px',
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick:       false, // don't navigate while editing
        autolink:          true,  // auto-detect pasted URLs
        defaultProtocol:   'https',
        HTMLAttributes: {
          target: '_blank',
          rel:    'noopener noreferrer',
          class:  'rte-link',
        },
      }),
    ],
    content:     value || '',
    editorProps: {
      attributes: {
        class: 'rte-content',
        dir,
        'data-placeholder': placeholder,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange?.(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external value changes (e.g. when post data loads asynchronously)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next    = value || '';
    if (current !== next) {
      // false = don't emit history entry
      editor.commands.setContent(next, false);
    }
  }, [value, editor]);

  const html = editor?.getHTML() ?? value ?? '';

  return (
    <div className="rte-root" dir={dir}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="rte-body" />
      {/* Hidden input for native <form> submissions */}
      {name && (
        <input type="hidden" name={name} value={html === '<p></p>' ? '' : html} readOnly />
      )}
    </div>
  );
}
