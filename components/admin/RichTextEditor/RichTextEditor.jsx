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

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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

// ── Toolbar ───────────────────────────────────────────────────────────────────
function Toolbar({ editor }) {
  if (!editor) return null;

  return (
    <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">

      {/* Headings */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >H2</ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >H3</ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        active={editor.isActive('heading', { level: 4 })}
        title="Heading 4"
      >H4</ToolbarBtn>

      <Divider />

      {/* Inline marks */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      ><b>B</b></ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      ><i>I</i></ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      ><s>S</s></ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline code"
      ><code>`c`</code></ToolbarBtn>

      <Divider />

      {/* Lists */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>format_list_bulleted</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered list"
      >
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>format_list_numbered</span>
      </ToolbarBtn>

      <Divider />

      {/* Blocks */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>format_quote</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code block"
      >
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>code</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        title="Horizontal rule"
      >
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>horizontal_rule</span>
      </ToolbarBtn>

      <Divider />

      {/* History */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>undo</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <span className="material-symbols-sharp" style={{ fontSize: '1rem' }}>redo</span>
      </ToolbarBtn>

      <Divider />

      {/* Clear formatting */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        active={false}
        title="Clear all formatting"
      >
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
