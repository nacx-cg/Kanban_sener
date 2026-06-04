import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdminUser } from '@/lib/auth-helpers';
import { AdminPageContent } from '@/components/admin/AdminPageContent';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/es/login');
  }

  const userIsAdmin = await isAdminUser(session.user.id);
  if (!userIsAdmin) {
    redirect('/es/dashboard');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      <AdminPageContent />
    </div>
  );
}

