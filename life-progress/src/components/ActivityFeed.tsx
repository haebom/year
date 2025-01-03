'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Activity } from '@/types';
import useStore from '@/store/useStore';

interface ActivityFeedProps {
  userId: string;
  friends: string[];
}

const ActivityItem = memo(({ activity }: { activity: Activity }) => {
  const getActivityEmoji = (type: Activity['type']) => {
    switch (type) {
      case 'goal_created': return '🎯';
      case 'goal_progress': return '📈';
      case 'goal_completed': return '🎉';
      case 'friend_joined': return '👋';
      default: return '📝';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-start gap-3">
        {activity.userPhotoURL ? (
          <div className="relative w-10 h-10">
            <Image
              src={activity.userPhotoURL}
              alt={activity.userName}
              fill
              className="rounded-full object-cover"
              sizes="40px"
              priority={false}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            {activity.userName[0]}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{activity.userName}</span>
            <span className="text-sm text-gray-500">
              {formatTime(activity.createdAt)}
            </span>
          </div>
          <p className="mt-1">
            {getActivityEmoji(activity.type)} {activity.content}
          </p>
          {activity.metadata?.progress !== undefined && (
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${activity.metadata.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';

export function ActivityFeed({ userId, friends }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { getCachedUser } = useStore();

  const subscribeToActivities = useCallback(() => {
    if (!userId || !friends.length) {
      setActivities([]);
      setLoading(false);
      return () => {};
    }

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1초

    const subscribe = () => {
      const q = query(
        collection(db, 'activities'),
        where('userId', 'in', [...friends, userId]),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      return onSnapshot(q, 
        async (snapshot) => {
          const newActivities = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data();
              const user = await getCachedUser(data.userId);
              return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate(),
                userName: user?.name || 'Unknown',
                userPhotoURL: user?.photoURL,
              } as Activity;
            })
          );
          
          setActivities(newActivities);
          setLoading(false);
          retryCount = 0; // 성공하면 재시도 카운트 리셋
        },
        async (error) => {
          console.error('활동 피드 구독 중 오류 발생:', error);
          
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`재연결 시도 ${retryCount}/${maxRetries}...`);
            
            // 이전 구독 취소
            unsubscribe();
            
            // 지연 후 재시도
            await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
            unsubscribe = subscribe();
          } else {
            setLoading(false);
            setActivities([]);
          }
        }
      );
    };

    let unsubscribe = subscribe();
    return () => unsubscribe();
  }, [userId, friends, getCachedUser]);

  useEffect(() => {
    const unsubscribe = subscribeToActivities();
    return () => unsubscribe();
  }, [subscribeToActivities]);

  if (loading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  if (!activities.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        아직 활동이 없습니다.
        <br />
        친구를 추가하고 목표를 달성해보세요!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
} 