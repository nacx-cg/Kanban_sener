"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Clock } from "lucide-react";

interface MotivationalMessageProps {
  currentStreak: number;
  weeklyProgress: number;
  weeklyGoal: number;
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

export function MotivationalMessage({
  currentStreak,
  weeklyProgress,
  weeklyGoal,
}: MotivationalMessageProps) {
  const locale = useLocale();
  const [messageData, setMessageData] = useState<MessageData | null>(null);
  const [loading, setLoading] = useState(true);
  const progressPercentage = weeklyGoal > 0 
    ? (weeklyProgress / weeklyGoal) * 100 
    : 0;

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/motivational-messages?locale=${locale}`);
        if (response.ok) {
          const messages: Messages = await response.json();
          
          // Always show the most recently updated message (feed-like behavior)
          // Sort all messages by most recently updated first
          const sortedMessages = Object.values(messages).sort((a, b) => 
            new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime()
          );
          
          // Select the most recently updated message
          const selectedMessageData = sortedMessages[0];
          
          if (selectedMessageData) {
            setMessageData(selectedMessageData);
          } else {
            // Final fallback
            setMessageData({
              message: "¡Sigue adelante!",
              editor: null,
              editedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("Error fetching motivational messages:", error);
        setMessageData({
          message: "¡Sigue adelante!",
          editor: null,
          editedAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // Refresh messages every 10 seconds to show updates quickly
    const interval = setInterval(fetchMessages, 10000);
    
    return () => clearInterval(interval);
  }, [locale, currentStreak, progressPercentage]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">💪</div>
            <div>
              <p className="text-lg font-medium text-gray-800">Cargando...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!messageData) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const timeAgo = messageData.editedAt
    ? formatDistanceToNow(new Date(messageData.editedAt), { addSuffix: true, locale: es })
    : null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💪</div>
          <div className="flex-1">
            <p className="text-lg font-medium text-gray-800 mb-3">{messageData.message}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {timeAgo && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Actualizado {timeAgo}
                </Badge>
              )}
              {messageData.editor && (
                <span className="text-xs text-gray-600">
                  por {messageData.editor.name || messageData.editor.email}
                </span>
              )}
              {messageData.editedAt && (
                <span className="text-xs text-gray-500">
                  ({formatDate(messageData.editedAt)})
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

