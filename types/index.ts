export type WorkType = 'feature' | 'bug' | 'task' | 'research';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'inProgress' | 'review' | 'done';

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  workType: WorkType;
  priority: Priority;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  timeInColumns: Record<string, number>; // JSON field
  tags: string[]; // JSON field
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  teamId: string | null;
  userId: string;
  columns: string[]; // JSON field
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  fromColumn: string | null;
  toColumn: string;
  timestamp: Date;
  duration: number | null;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  unlockedAt: Date;
  metadata: Record<string, any>; // JSON field
}

export interface UserStats {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  weeklyGoal: number;
  lastActivityDate: Date | null;
}

