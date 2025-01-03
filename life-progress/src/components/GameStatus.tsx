'use client';

import { useState } from 'react';
import { getRequiredExp, ACHIEVEMENTS } from '@/lib/gameSystem';
import type { GameStats } from '@/types';

interface GameStatusProps {
  gameStats: GameStats;
}

export function GameStatus({ gameStats }: GameStatusProps) {
  const [showAchievements, setShowAchievements] = useState(false);

  const currentLevelExp = getRequiredExp(gameStats.level);
  const expProgress = Math.min(100, (gameStats.experience % currentLevelExp) / currentLevelExp * 100);

  return (
    <div className="space-y-4">
      {/* 레벨 및 경험치 */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold">레벨 {gameStats.level}</h3>
            <p className="text-sm text-gray-600">
              다음 레벨까지 {currentLevelExp - (gameStats.experience % currentLevelExp)} EXP
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">포인트</p>
            <p className="text-lg font-bold">{gameStats.points.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${expProgress}%` }}
          />
        </div>
      </div>

      {/* 랭킹 정보 */}
      {gameStats.rank && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">나의 랭킹</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">전체 순위</p>
              <p className="text-xl font-bold">{gameStats.rank.global}위</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">친구 중 순위</p>
              <p className="text-xl font-bold">{gameStats.rank.friends}위</p>
            </div>
          </div>
        </div>
      )}

      {/* 업적 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className="w-full p-4 text-left flex items-center justify-between"
        >
          <h3 className="text-lg font-bold">업적</h3>
          <span className="text-sm text-gray-600">
            {gameStats.achievements.length}/{ACHIEVEMENTS.length} 달성
          </span>
        </button>

        {showAchievements && (
          <div className="p-4 border-t">
            <div className="grid gap-4">
              {ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = gameStats.achievements.some(a => a.id === achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${
                      isUnlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        {isUnlocked ? (
                          <p className="text-sm text-green-600 mt-1">달성 완료!</p>
                        ) : (
                          <div className="text-sm text-gray-500 mt-1">
                            <span>보상: </span>
                            <span className="text-yellow-600">{achievement.reward.points} 포인트</span>
                            <span className="mx-1">·</span>
                            <span className="text-blue-600">{achievement.reward.experience} EXP</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 