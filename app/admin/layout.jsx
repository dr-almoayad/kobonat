import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import AdminNav from "@/components/admin/AdminNav";
import './admin.css';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  // Notice: We removed the "if (!session) redirect(...)" logic here.
  // Middleware now handles security, which is the correct Next.js 15 way.

  return (
    <html>
      <head>
        {/* Material Symbols */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
          rel="stylesheet" 
        />
        
        {/* Google Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@100..900&family=Open+Sans:wght@300..800&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="admin-layout">
          {/* Only show Nav if user is logged in */}
          {session?.user?.isAdmin && <AdminNav user={session.user} />}
          <main className="admin-content">
            {children}
          </main>
        </div>
      </body>
    </html>
    
  );
}