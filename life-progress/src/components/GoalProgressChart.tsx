'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GoalProgressChartProps {
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

export function GoalProgressChart({ blocks }: GoalProgressChartProps) {
  const data = Object.values(blocks).map(block => ({
    name: block.title,
    progress: block.progress,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            label={{ value: '진행률 (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Bar
            dataKey="progress"
            fill="#3B82F6"
            name="진행률"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 