import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  redirect(`/${locale}/login`);
}

