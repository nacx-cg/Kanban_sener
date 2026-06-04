'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  isApproved: boolean;
  isHidden: boolean;
  createdAt: string;
}

export function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al cargar usuarios');
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(
        data.sort((a: AdminUser, b: AdminUser) =>
          a.isApproved === b.isApproved ? 0 : a.isApproved ? 1 : -1
        )
      );
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (
    userId: string,
    updates: { role?: string; isActive?: boolean; isApproved?: boolean; isHidden?: boolean }
  ) => {
    setUpdating((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al actualizar usuario');
        return;
      }
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
      );
      setError('');
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Error al actualizar usuario');
    } finally {
      setUpdating((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          Aprueba nuevos registros, activa permisos, bloquea cuentas o oculta usuarios del listado de asignación.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando usuarios...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay usuarios registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Email</th>
                      <th className="text-left py-3 px-2 font-medium">Nombre</th>
                      <th className="text-left py-3 px-2 font-medium">Aprobado</th>
                      <th className="text-left py-3 px-2 font-medium">Rol</th>
                      <th className="text-left py-3 px-2 font-medium">Activo</th>
                      <th className="text-left py-3 px-2 font-medium">Oculto</th>
                      <th className="text-left py-3 px-2 font-medium">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{user.email}</td>
                        <td className="py-3 px-2">{user.name || '-'}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isApproved}
                              onCheckedChange={(checked) =>
                                updateUser(user.id, { isApproved: checked })
                              }
                              disabled={updating[user.id]}
                            />
                            <span className="text-xs text-muted-foreground">
                              {user.isApproved ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Aprobado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  Pendiente
                                </Badge>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Select
                            value={user.role}
                            onValueChange={(value) =>
                              updateUser(user.id, { role: value })
                            }
                            disabled={updating[user.id]}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuario</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={(checked) =>
                                updateUser(user.id, { isActive: checked })
                              }
                              disabled={updating[user.id]}
                            />
                            <span className="text-xs text-muted-foreground">
                              {user.isActive ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Activo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  Bloqueado
                                </Badge>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isHidden}
                              onCheckedChange={(checked) =>
                                updateUser(user.id, { isHidden: checked })
                              }
                              disabled={updating[user.id]}
                            />
                            <span className="text-xs text-muted-foreground">
                              {user.isHidden ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  Oculto
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                  Visible
                                </Badge>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: es })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
