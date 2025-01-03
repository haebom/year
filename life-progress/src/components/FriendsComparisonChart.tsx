'use client';

import { useEffect, useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserData } from '@/types';

interface FriendsComparisonChartProps {
  userId: string;
  userData: UserData;
  friends: string[];
}

interface ComparisonData {
  category: string;
  me: number;
  friends: number;
}

export function FriendsComparisonChart({ userId, userData, friends }: FriendsComparisonChartProps) {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendsData = async () => {
      if (!friends.length) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'users'),
          where('id', 'in', friends)
        );

        const snapshot = await getDocs(q);
        const friendsData = snapshot.docs.map(doc => doc.data() as UserData);

        // 나의 통계 계산
        const myStats = {
          totalGoals: Object.keys(userData.blocks).length,
          completedGoals: Object.values(userData.blocks).filter(block => block.progress === 100).length,
          averageProgress: Object.values(userData.blocks).reduce((sum, block) => sum + block.progress, 0) / 
            (Object.keys(userData.blocks).length || 1),
        };

        // 친구들의 평균 통계 계산
        const friendsStats = {
          totalGoals: Math.round(friendsData.reduce((sum, friend) => 
            sum + Object.keys(friend.blocks).length, 0) / friendsData.length),
          completedGoals: Math.round(friendsData.reduce((sum, friend) => 
            sum + Object.values(friend.blocks).filter(block => block.progress === 100).length, 0) / friendsData.length),
          averageProgress: Math.round(friendsData.reduce((sum, friend) => {
            const friendAvg = Object.values(friend.blocks).reduce((blockSum, block) => 
              blockSum + block.progress, 0) / (Object.keys(friend.blocks).length || 1);
            return sum + friendAvg;
          }, 0) / friendsData.length),
        };

        setData([
          {
            category: '전체 목표 수',
            me: myStats.totalGoals,
            friends: friendsStats.totalGoals,
          },
          {
            category: '완료한 목표',
            me: myStats.completedGoals,
            friends: friendsStats.completedGoals,
          },
          {
            category: '평균 진행률',
            me: Math.round(myStats.averageProgress),
            friends: Math.round(friendsStats.averageProgress),
          },
        ]);
      } catch (error) {
        console.error('친구 데이터 로딩 중 오류 발생:', error);
      }

      setLoading(false);
    };

    fetchFriendsData();
  }, [userId, userData, friends]);

  if (loading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  if (!friends.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        친구를 추가하면 친구들과 통계를 비교할 수 있습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
          <Radar
            name="나의 통계"
            dataKey="me"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.6}
          />
          <Radar
            name="친구들 평균"
            dataKey="friends"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.6}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
} 