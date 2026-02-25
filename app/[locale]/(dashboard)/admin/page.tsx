import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-helpers';
import { EditMotivationalMessages } from '@/components/admin/EditMotivationalMessages';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/es/login');
  }

  if (!isAdmin(session.user.email)) {
    redirect('/es/dashboard');
  }

  return (
    <div className="container mx-auto py-8">
      <EditMotivationalMessages />
    </div>
  );
}

