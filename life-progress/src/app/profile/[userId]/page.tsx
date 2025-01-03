'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { GoalProgressChart } from '@/components/GoalProgressChart';
import { TimeStatsDashboard } from '@/components/TimeStatsDashboard';
import { subscribeToUser, unsubscribeFromUser, checkSubscriptionStatus } from '@/lib/subscription';
import useStore from '@/store/useStore';
import type { UserData } from '@/types';

interface ProfilePageProps {
  params: {
    userId: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { user, userData: currentUserData } = useStore();
  const [profileData, setProfileData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const docRef = doc(db, 'users', params.userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            id: params.userId,
            email: data.email,
            name: data.name,
            birthDate: data.birthDate?.toDate(),
            photoURL: data.photoURL,
            friends: data.friends || [],
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            blocks: data.blocks || {},
            gameStats: data.gameStats || {
              level: 1,
              experience: 0,
              points: 0,
              achievements: [],
            },
          });

          // 구독 상태 확인
          if (user) {
            const subscribed = await checkSubscriptionStatus(user.uid, params.userId);
            setIsSubscribed(subscribed);
          }
        }
      } catch (error) {
        console.error('프로필 데이터 로딩 중 오류 발생:', error);
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [params.userId, user]);

  const handleSubscriptionToggle = async () => {
    if (!user || !currentUserData || !profileData) return;

    setSubscribing(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromUser(user.uid, profileData.id);
      } else {
        await subscribeToUser(user.uid, currentUserData, profileData.id);
      }
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('구독 상태 변경 중 오류 발생:', error);
    }
    setSubscribing(false);
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!profileData) {
    return <div className="text-center py-8">사용자를 찾을 수 없습니다.</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* 프로필 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-6">
          {profileData.photoURL ? (
            <div className="relative w-24 h-24">
              <Image
                src={profileData.photoURL}
                alt={profileData.name}
                fill
                className="rounded-full object-cover"
                sizes="96px"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
              {profileData.name[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profileData.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-sm text-gray-600">
                레벨 {profileData.gameStats.level}
              </div>
              <div className="text-sm text-gray-600">
                {profileData.gameStats.points.toLocaleString()} 포인트
              </div>
              <div className="text-sm text-gray-600">
                {Object.keys(profileData.blocks).length}개의 목표
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubscriptionToggle}
              variant={isSubscribed ? 'outline' : 'default'}
              disabled={subscribing}
            >
              {subscribing ? '처리 중...' : isSubscribed ? '구독 중' : '구독하기'}
            </Button>
            <Button variant="outline">
              친구 추가
            </Button>
          </div>
        </div>
      </div>

      {/* 목표 진행률 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">목표 진행률</h2>
        <GoalProgressChart blocks={profileData.blocks} />
      </div>

      {/* 통계 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">통계</h2>
        <TimeStatsDashboard blocks={profileData.blocks} />
      </div>

      {/* 업적 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">업적</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {profileData.gameStats.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="p-4 rounded-lg bg-green-50 border border-green-200"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <h3 className="font-semibold">{achievement.title}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 