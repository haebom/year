import { create } from 'zustand';
import { User, Quest, Notification, Friend } from '@/types';

interface Store {
  user: User | null;
  quests: Quest[];
  notifications: Notification[];
  friends: Friend[];
  setUser: (user: User | null) => void;
  setQuests: (quests: Quest[]) => void;
  addQuest: (quest: Quest) => void;
  updateQuest: (quest: Quest) => void;
  deleteQuest: (questId: string) => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
}

type State = {
  user: User | null;
  quests: Quest[];
  notifications: Notification[];
  friends: Friend[];
};

const useStore = create<Store>((set) => ({
  user: null,
  quests: [],
  notifications: [],
  friends: [],
  
  setUser: (user: User | null) => set({ user }),
  
  setQuests: (quests: Quest[]) => set({ quests }),
  addQuest: (quest: Quest) =>
    set((state: State) => ({ quests: [...state.quests, quest] })),
  updateQuest: (quest: Quest) =>
    set((state: State) => ({
      quests: state.quests.map((q: Quest) => (q.id === quest.id ? quest : q)),
    })),
  deleteQuest: (questId: string) =>
    set((state: State) => ({
      quests: state.quests.filter((q: Quest) => q.id !== questId),
    })),
  
  setNotifications: (notifications: Notification[]) => set({ notifications }),
  addNotification: (notification: Notification) =>
    set((state: State) => ({
      notifications: [...state.notifications, notification],
    })),
  markNotificationAsRead: (notificationId: string) =>
    set((state: State) => ({
      notifications: state.notifications.map((n: Notification) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    })),
  
  setFriends: (friends: Friend[]) => set({ friends }),
  addFriend: (friend: Friend) =>
    set((state: State) => ({ friends: [...state.friends, friend] })),
  removeFriend: (friendId: string) =>
    set((state: State) => ({
      friends: state.friends.filter((f: Friend) => f.id !== friendId),
    })),
}));

export default useStore; 