import { create } from 'zustand';
import { User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchUserData } from '@/lib/firebase';
import type { UserData, Block } from '@/types';

interface Store {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  cachedUsers: Map<string, UserData>;
  setUser: (user: User | null) => void;
  setUserData: (userData: UserData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUserData: (userId: string) => Promise<void>;
  updateBlock: (blockId: string, blockData: Partial<Block>) => Promise<void>;
  getCachedUser: (userId: string) => Promise<UserData | null>;
}

const useStore = create<Store>((set, get) => ({
  user: null,
  userData: null,
  loading: false,
  error: null,
  cachedUsers: new Map(),

  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchUserData: async (userId) => {
    try {
      set({ loading: true, error: null });
      const data = await fetchUserData(userId);
      if (data) {
        // 캐시에 사용자 데이터 저장
        get().cachedUsers.set(userId, data);
        if (get().user?.uid === userId) {
          set({ userData: data });
        }
      }
    } catch (err) {
      console.error('사용자 데이터를 불러오는데 실패했습니다:', err);
      set({ error: '사용자 데이터를 불러오는데 실패했습니다.' });
    } finally {
      set({ loading: false });
    }
  },

  updateBlock: async (blockId, blockData) => {
    const { user, userData } = get();
    if (!user || !userData) return;

    try {
      const existingBlock = userData.blocks[blockId];
      const updatedBlock = {
        ...existingBlock,
        ...blockData,
        updatedAt: new Date(),
      };

      const updatedBlocks = {
        ...userData.blocks,
        [blockId]: updatedBlock,
      };

      await updateDoc(doc(db, 'users', user.uid), {
        blocks: updatedBlocks,
        updatedAt: new Date(),
      });

      set({
        userData: {
          ...userData,
          blocks: updatedBlocks,
        },
      });
    } catch (error) {
      console.error('블록 업데이트 중 오류 발생:', error);
    }
  },

  getCachedUser: async (userId) => {
    const { cachedUsers } = get();
    if (cachedUsers.has(userId)) {
      return cachedUsers.get(userId) || null;
    }

    try {
      const data = await fetchUserData(userId);
      if (data) {
        cachedUsers.set(userId, data);
        return data;
      }
    } catch (error) {
      console.error('사용자 데이터 로딩 중 오류 발생:', error);
    }
    return null;
  },
}));

export default useStore; 