export interface User {
  uid: string;
  email: string | null;
  birthDate?: string;
  lifeExpectancy?: number;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'quest' | 'friend' | 'system';
  read: boolean;
  createdAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  displayName?: string;
  photoURL?: string;
} 