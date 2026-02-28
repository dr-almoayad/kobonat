// app/admin/page.jsx
// Redirect root /admin → /admin/dashboard (the canonical dashboard).
// Keeps any bookmarks / old links working without showing a duplicate page.

import { redirect } from 'next/navigation';

export default function AdminRoot() {
  redirect('/admin/dashboard');
}
