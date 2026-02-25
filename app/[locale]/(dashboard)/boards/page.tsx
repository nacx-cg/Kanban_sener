import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default async function BoardsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/es/login');
  }

  return (
    <div className="container mx-auto py-8">
      <DashboardContent />
    </div>
  );
}

