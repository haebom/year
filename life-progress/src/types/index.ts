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
  senderId?: string;
  senderName?: string;
  senderPhotoURL?: string;
  title: string;
  message: string;
  type: 'friend_request' | 'goal_achievement' | 'cheer' | 'system';
  metadata?: {
    goalId?: string;
    goalTitle?: string;
    progress?: number;
    friendId?: string;
  };
  read: boolean;
  createdAt: Date;
  action?: {
    type: 'accept_friend' | 'view_goal' | 'send_cheer';
    data?: {
      friendId?: string;
      goalId?: string;
      message?: string;
    };
  };
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

export interface UserData {
  id: string;
  email: string;
  name: string;
  birthDate?: Date;
  photoURL?: string;
  friends?: string[];
  createdAt: Date;
  updatedAt: Date;
  blocks: {
    [key: string]: {
      title: string;
      description?: string;
      progress: number;
      createdAt: Date;
      updatedAt: Date;
    };
  };
  gameStats: GameStats;
  lastActive?: Date;
  streak?: number;
}

export interface Block {
  id: string;
  title: string;
  description?: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  type: 'goal_created' | 'goal_progress' | 'goal_completed' | 'friend_joined';
  content: string;
  metadata?: {
    goalId?: string;
    goalTitle?: string;
    progress?: number;
  };
  createdAt: Date;
}

export interface GameStats {
  level: number;
  experience: number;
  points: number;
  achievements: Achievement[];
  rank?: {
    global: number;
    friends: number;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: {
    type: 'goals_completed' | 'total_goals' | 'consecutive_days' | 'points_earned' | 'level_reached';
    value: number;
  };
  reward: {
    points: number;
    experience: number;
  };
  unlockedAt?: Date;
} 