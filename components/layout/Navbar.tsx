'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const t = useTranslations('navigation');
  const tAuth = useTranslations('auth');
  const tAdmin = useTranslations('admin');
  const router = useRouter();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/users/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.isAdmin) {
            setIsAdmin(true);
          }
        })
        .catch(() => {
          // Silently fail
        });
    }
  }, [session]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/es/login');
    router.refresh();
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/es/dashboard" className="text-lg font-bold hover:underline">
              <span className="hidden md:inline">Coordinación Jurídica del Sector Eléctrico</span>
              <span className="md:hidden">CJSE</span>
            </Link>
            {session && (
              <>
                <Link
                  href="/es/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href="/es/boards"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t('boards')}
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {session.user?.name || session.user?.email}
                  </span>
                  {isAdmin && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
                      {tAdmin('badge')}
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  {tAuth('logout')}
                </Button>
              </>
            ) : (
              <Link href="/es/login">
                <Button variant="outline" size="sm">
                  {tAuth('login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

