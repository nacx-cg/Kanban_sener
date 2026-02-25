'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Clock } from 'lucide-react';

interface MessageHistory {
  id: string;
  message: string;
  changedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  changedAt: string | Date; // Can be string from API or Date object
}

interface MessageData {
  message: string;
  editor: {
    name: string | null;
    email: string;
  } | null;
  editedAt: string;
}

interface Messages {
  [key: string]: MessageData;
}

const messageLabels: Record<string, string> = {
  goodMorning: 'Buenos Días',
  streakMilestone: 'Hito de Racha',
  goalProgress: 'Progreso de Meta',
  keepGoing: 'Sigue Adelante',
};

// Helper function to format message key for display
const formatMessageKey = (key: string): string => {
  if (messageLabels[key]) {
    return messageLabels[key];
  }
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export function EditMotivationalMessages() {
  const t = useTranslations('common');
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Messages | null>(null);
  const [messageHistory, setMessageHistory] = useState<Record<string, MessageHistory[]>>({});
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newMessageKey, setNewMessageKey] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/motivational-messages?locale=es');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Error al cargar mensajes');
        return;
      }
      
      const data: Messages = await response.json();
      if (!data || Object.keys(data).length === 0) {
        setError('No se encontraron mensajes');
        return;
      }
      
      setMessages(data);

      // Fetch history for each message
      const history: Record<string, MessageHistory[]> = {};
      for (const key of Object.keys(data)) {
        try {
          const historyResponse = await fetch(`/api/motivational-messages/${key}/history?locale=es`);
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            history[key] = Array.isArray(historyData) ? historyData : [];
          }
        } catch (err) {
          console.error(`Error fetching history for ${key}:`, err);
          history[key] = [];
        }
      }
      setMessageHistory(history);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Error al cargar mensajes. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (key: string, currentMessage: string) => {
    setEditing({ ...editing, [key]: currentMessage });
  };

  const handleCancel = (key: string) => {
    const newEditing = { ...editing };
    delete newEditing[key];
    setEditing(newEditing);
  };

  const handleSave = async (key: string) => {
    const newMessage = editing[key];
    if (!newMessage || !newMessage.trim()) {
      setError('El mensaje no puede estar vacío');
      return;
    }

    setSaving({ ...saving, [key]: true });
    setError('');

    try {
      const response = await fetch('/api/motivational-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          message: newMessage.trim(),
          locale: 'es',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al guardar mensaje');
        return;
      }

      // Refresh messages
      await fetchMessages();
      handleCancel(key);
    } catch (err) {
      setError('Error al guardar mensaje');
      console.error('Error saving message:', err);
    } finally {
      setSaving({ ...saving, [key]: false });
    }
  };

  const handleCreate = async () => {
    if (!newMessageKey.trim() || !newMessageText.trim()) {
      setError('La clave y el mensaje son requeridos');
      return;
    }

    // Validate key format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(newMessageKey.trim())) {
      setError('La clave solo puede contener letras, números y guiones bajos');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/motivational-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newMessageKey.trim(),
          message: newMessageText.trim(),
          locale: 'es',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al crear mensaje');
        return;
      }

      // Refresh messages and close dialog
      await fetchMessages();
      setIsCreateDialogOpen(false);
      setNewMessageKey('');
      setNewMessageText('');
    } catch (err) {
      setError('Error al crear mensaje');
      console.error('Error creating message:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando mensajes...</div>;
  }

  if (!messages) {
    return <div className="text-center py-8">No se pudieron cargar los mensajes</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Mensajes Grupales</h2>
          <p className="text-muted-foreground">
            Personaliza los mensajes grupales que aparecen en el dashboard.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Mensaje
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {Object.entries(messages).map(([key, messageData]) => {
          const isEditing = key in editing;
          const history = messageHistory[key] || [];
          const editorName = messageData.editor?.name || messageData.editor?.email || 'Sistema';
          const changedAt = messageData.editedAt
            ? format(new Date(messageData.editedAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
            : 'Nunca';
          
          // Get last 2 history entries
          const lastTwoHistory = history.slice(0, 2);

          const timeAgo = messageData.editedAt
            ? formatDistanceToNow(new Date(messageData.editedAt), { addSuffix: true, locale: es })
            : 'Nunca';

          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{formatMessageKey(key)}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Actualizado {timeAgo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        por {editorName}
                      </span>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  Última edición: {changedAt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`message-${key}`}>Mensaje</Label>
                      <Textarea
                        id={`message-${key}`}
                        value={editing[key]}
                        onChange={(e) =>
                          setEditing({ ...editing, [key]: e.target.value })
                        }
                        rows={3}
                        disabled={saving[key]}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSave(key)}
                        disabled={saving[key]}
                      >
                        {saving[key] ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCancel(key)}
                        disabled={saving[key]}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium whitespace-pre-wrap">
                        {messageData.message}
                      </p>
                      {lastTwoHistory.length > 0 && (
                        <div className="space-y-1 pt-2 border-t">
                          <p className="text-xs text-muted-foreground font-medium mb-2">
                            Historial reciente:
                          </p>
                          {lastTwoHistory.map((hist) => (
                            <div
                              key={hist.id}
                              className="text-xs text-muted-foreground opacity-60 line-through"
                            >
                              <span className="italic">
                                &quot;{hist.message}&quot;
                              </span>
                              <span className="ml-2">
                                - {hist.changedBy.name || hist.changedBy.email} el{' '}
                                {format(new Date(hist.changedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(key, messageData.message)}
                    >
                      {t('edit')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create New Message Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Mensaje</DialogTitle>
            <DialogDescription>
              Crea un nuevo mensaje motivacional. La clave debe ser única y solo puede contener letras, números y guiones bajos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-key">Clave del Mensaje *</Label>
              <Input
                id="new-key"
                value={newMessageKey}
                onChange={(e) => setNewMessageKey(e.target.value)}
                placeholder="ej: mensajeBienvenida"
                disabled={creating}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Solo letras, números y guiones bajos. Máximo 50 caracteres.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-message">Mensaje *</Label>
              <Textarea
                id="new-message"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Escribe tu mensaje motivacional aquí..."
                rows={4}
                disabled={creating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewMessageKey('');
                setNewMessageText('');
                setError('');
              }}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creando...' : 'Crear Mensaje'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

