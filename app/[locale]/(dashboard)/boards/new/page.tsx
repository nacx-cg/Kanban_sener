import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { CreateBoardForm } from '@/components/board/CreateBoardForm';

export default async function NewBoardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/es/login');
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Tablero</h1>
      <CreateBoardForm />
    </div>
  );
}
