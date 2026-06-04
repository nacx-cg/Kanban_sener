'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getSession, signIn } from 'next-auth/react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export function LoginForm() {
  const t = useTranslations('auth');
  const params = useParams<{ locale: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true' && searchParams.get('pendingApproval') === 'true') {
      setInfo('Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador. Podrás iniciar sesión cuando sea aprobada.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === 'CredentialsSignin'
            ? t('invalidCredentials')
            : result.error
        );
      } else if (result?.ok) {
        // Wait for session cookie before navigating (avoids dashboard kicking back to login)
        await getSession();
        window.location.assign(`/${locale}/dashboard`);
      }
    } catch (err) {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('login')}</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {info && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
              {info}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cargando...' : t('login')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <Link href={`/${locale}/register`} className="text-primary hover:underline">
              {t('register')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

