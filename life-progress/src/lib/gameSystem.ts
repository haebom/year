'use client';

import { collection, query, where, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserData, Achievement, GameStats } from '@/types';

// 레벨별 필요 경험치 계산
export function getRequiredExp(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// 경험치 획득에 따른 레벨 계산
export function calculateLevel(exp: number): number {
  let level = 1;
  while (exp >= getRequiredExp(level)) {
    exp -= getRequiredExp(level);
    level++;
  }
  return level;
}

// 기본 업적 목록
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_goal',
    title: '첫 걸음',
    description: '첫 번째 목표를 생성하세요',
    icon: '🎯',
    requirement: {
      type: 'total_goals',
      value: 1,
    },
    reward: {
      points: 100,
      experience: 50,
    },
  },
  {
    id: 'goal_master',
    title: '목표 달성의 달인',
    description: '10개의 목표를 완료하세요',
    icon: '🏆',
    requirement: {
      type: 'goals_completed',
      value: 10,
    },
    reward: {
      points: 1000,
      experience: 500,
    },
  },
  {
    id: 'streak_week',
    title: '꾸준한 노력',
    description: '7일 연속으로 접속하세요',
    icon: '🔥',
    requirement: {
      type: 'consecutive_days',
      value: 7,
    },
    reward: {
      points: 500,
      experience: 200,
    },
  },
  // 더 많은 업적 추가 가능
];

// 업적 달성 체크 및 보상 지급
export async function checkAchievements(userId: string, userData: UserData): Promise<Achievement[]> {
  const newAchievements: Achievement[] = [];
  const unlockedIds = userData.gameStats.achievements.map(a => a.id);

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.includes(achievement.id)) continue;

    let isUnlocked = false;
    switch (achievement.requirement.type) {
      case 'total_goals':
        isUnlocked = Object.keys(userData.blocks).length >= achievement.requirement.value;
        break;
      case 'goals_completed':
        isUnlocked = Object.values(userData.blocks).filter(b => b.progress === 100).length >= achievement.requirement.value;
        break;
      case 'consecutive_days':
        isUnlocked = (userData.streak || 0) >= achievement.requirement.value;
        break;
      case 'points_earned':
        isUnlocked = userData.gameStats.points >= achievement.requirement.value;
        break;
      case 'level_reached':
        isUnlocked = userData.gameStats.level >= achievement.requirement.value;
        break;
    }

    if (isUnlocked) {
      const unlockedAchievement = {
        ...achievement,
        unlockedAt: new Date(),
      };
      newAchievements.push(unlockedAchievement);
    }
  }

  if (newAchievements.length > 0) {
    const updatedGameStats: GameStats = {
      ...userData.gameStats,
      achievements: [...userData.gameStats.achievements, ...newAchievements],
      points: userData.gameStats.points + newAchievements.reduce((sum, a) => sum + a.reward.points, 0),
      experience: userData.gameStats.experience + newAchievements.reduce((sum, a) => sum + a.reward.experience, 0),
    };

    // 레벨 업데이트
    updatedGameStats.level = calculateLevel(updatedGameStats.experience);

    await updateDoc(doc(db, 'users', userId), {
      gameStats: updatedGameStats,
    });
  }

  return newAchievements;
}

// 랭킹 업데이트
export async function updateRankings(userId: string, userData: UserData): Promise<void> {
  // 전체 랭킹 계산
  const globalQ = query(
    collection(db, 'users'),
    orderBy('gameStats.points', 'desc'),
    limit(1000)
  );

  const globalSnapshot = await getDocs(globalQ);
  const globalRank = globalSnapshot.docs.findIndex(doc => doc.id === userId) + 1;

  // 친구 랭킹 계산
  let friendRank = 1;
  if (userData.friends?.length) {
    const friendsQ = query(
      collection(db, 'users'),
      where('id', 'in', userData.friends),
      orderBy('gameStats.points', 'desc')
    );

    const friendsSnapshot = await getDocs(friendsQ);
    const friendsList = friendsSnapshot.docs.map(doc => ({
      id: doc.id,
      points: doc.data().gameStats.points,
    }));

    friendsList.push({
      id: userId,
      points: userData.gameStats.points,
    });

    friendsList.sort((a, b) => b.points - a.points);
    friendRank = friendsList.findIndex(user => user.id === userId) + 1;
  }

  // 랭킹 업데이트
  await updateDoc(doc(db, 'users', userId), {
    'gameStats.rank': {
      global: globalRank,
      friends: friendRank,
    },
  });
}

// 포인트 및 경험치 획득
export async function awardPoints(
  userId: string,
  userData: UserData,
  points: number,
  experience: number
): Promise<void> {
  const updatedGameStats: GameStats = {
    ...userData.gameStats,
    points: userData.gameStats.points + points,
    experience: userData.gameStats.experience + experience,
  };

  // 레벨 업데이트
  updatedGameStats.level = calculateLevel(updatedGameStats.experience);

  await updateDoc(doc(db, 'users', userId), {
    gameStats: updatedGameStats,
  });
} 