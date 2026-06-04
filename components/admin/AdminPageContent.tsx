'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EditMotivationalMessages } from './EditMotivationalMessages';
import { AdminTasksList } from './AdminTasksList';
import { UsersManagement } from './UsersManagement';
import { MessageSquare, LayoutGrid, Users } from 'lucide-react';

type TabId = 'messages' | 'tasks' | 'users';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'messages', label: 'Mensajes', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'tasks', label: 'Tareas', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'users', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
];

export function AdminPageContent() {
  const [activeTab, setActiveTab] = useState<TabId>('messages');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="gap-2"
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'messages' && <EditMotivationalMessages />}
      {activeTab === 'tasks' && <AdminTasksList />}
      {activeTab === 'users' && <UsersManagement />}
    </div>
  );
}
