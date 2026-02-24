'use client';

export default function BlogDeleteButton({ label = 'Delete', confirmMessage = 'Are you sure?' }) {
  function handleClick(e) {
    if (!window.confirm(confirmMessage)) {
      e.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      style={{
        padding: '8px 16px',
        borderRadius: 8,
        border: '1px solid #fecaca',
        background: '#fff',
        color: '#dc2626',
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}
