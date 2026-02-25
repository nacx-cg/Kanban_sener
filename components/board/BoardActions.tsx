'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Eye, EyeOff } from 'lucide-react';

interface BoardActionsProps {
  board: {
    id: string;
    name: string;
    userId: string;
    teamId: string | null;
    team?: {
      id: string;
      name: string;
      isPublic: boolean;
    } | null;
  };
  isOwner: boolean;
  isAdmin: boolean;
}

export function BoardActions({ board, isOwner, isAdmin }: BoardActionsProps) {
  const t = useTranslations('board');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';
  const [deleting, setDeleting] = useState(false);
  // Board is public if it has a team AND that team is public
  const initialIsPublic = board.teamId !== null && board.team?.isPublic === true;
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  // Sync state when board prop changes (e.g., after router.refresh())
  useEffect(() => {
    const newIsPublic = board.teamId !== null && board.team?.isPublic === true;
    setIsPublic(newIsPublic);
  }, [board.teamId, board.team?.isPublic]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/boards/${board.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push(`/${locale}/boards`);
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || t('deleteBoardError'));
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      alert(t('deleteBoardError'));
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePrivacy = async (checked: boolean) => {
    setUpdatingPrivacy(true);
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: checked }),
      });
      if (res.ok) {
        const updatedBoard = await res.json();
        // Update state: public if has team AND team is public
        const newIsPublic = updatedBoard.teamId !== null && updatedBoard.team?.isPublic === true;
        setIsPublic(newIsPublic);
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || t('updatePrivacyError'));
        // Revert the switch state on error
        setIsPublic(!checked);
      }
    } catch (error) {
      console.error('Error updating board privacy:', error);
      alert(t('updatePrivacyError'));
      // Revert the switch state on error
      setIsPublic(!checked);
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const canDelete = isOwner || isAdmin;
  const canTogglePrivacy = isOwner || isAdmin;

  if (!canDelete && !canTogglePrivacy) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {canTogglePrivacy && (
        <div className="flex items-center space-x-2">
          <Switch
            id="board-privacy"
            checked={isPublic}
            onCheckedChange={handleTogglePrivacy}
            disabled={updatingPrivacy}
          />
          <Label htmlFor="board-privacy" className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer">
            {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {isPublic ? t('public') : t('private')}
          </Label>
        </div>
      )}

      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? tCommon('deleting') : tCommon('delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('confirmDeleteBoardTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirmDeleteBoardDescription', { boardName: board.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {tCommon('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}


