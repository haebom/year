'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TimeStatsDashboardProps {
  blocks: {
    [key: string]: {
      title: string;
      description?: string;
      progress: number;
      createdAt: Date;
      updatedAt: Date;
    };
  };
}

export function TimeStatsDashboard({ blocks }: TimeStatsDashboardProps) {
  const completedGoals = Object.values(blocks).filter(block => block.progress === 100).length;
  const inProgressGoals = Object.values(blocks).filter(block => block.progress > 0 && block.progress < 100).length;
  const notStartedGoals = Object.values(blocks).filter(block => block.progress === 0).length;

  const data = [
    { name: '완료된 목표', value: completedGoals, color: '#10B981' },
    { name: '진행 중인 목표', value: inProgressGoals, color: '#3B82F6' },
    { name: '시작하지 않은 목표', value: notStartedGoals, color: '#6B7280' },
  ];

  const totalGoals = Object.values(blocks).length;
  const averageProgress = totalGoals > 0
    ? Math.round(Object.values(blocks).reduce((sum, block) => sum + block.progress, 0) / totalGoals)
    : 0;

  // 최근 7일간 완료된 목표 수 계산
  const lastWeekCompleted = Object.values(blocks).filter(block => {
    const completedDate = block.progress === 100 ? block.updatedAt : null;
    if (!completedDate) return false;
    const daysDiff = Math.floor((new Date().getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 목표 상태 파이 차트 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">목표 상태 분포</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-sm text-gray-600">{item.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-rows-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h4 className="text-sm text-gray-600">전체 목표 달성률</h4>
          <div className="text-2xl font-bold mt-1">{averageProgress}%</div>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h4 className="text-sm text-gray-600">이번 주 완료한 목표</h4>
          <div className="text-2xl font-bold mt-1">{lastWeekCompleted}개</div>
          <div className="text-sm text-gray-500 mt-1">
            전체 {completedGoals}개 중
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h4 className="text-sm text-gray-600">현재 진행 중인 목표</h4>
          <div className="text-2xl font-bold mt-1">{inProgressGoals}개</div>
          <div className="text-sm text-gray-500 mt-1">
            전체 {totalGoals}개 중
          </div>
        </div>
      </div>
    </div>
  );
} 