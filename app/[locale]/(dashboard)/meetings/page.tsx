import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { MeetingsList } from '@/components/meetings/MeetingsList';

export default async function MeetingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/es/login');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Reuniones</h1>
      <MeetingsList />
    </div>
  );
}
