'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { AgeCalculator } from '@/components/AgeCalculator';
import { ActivityFeed } from '@/components/ActivityFeed';
import { NotificationCenter } from '@/components/NotificationCenter';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import useStore from '@/store/useStore';
import { auth, db } from '@/lib/firebase';
import { recordActivity, createActivityContent } from '@/lib/activity';
import type { UserData, Block, Notification } from '@/types';
import { GoalProgressChart } from '@/components/GoalProgressChart';
import { TimeStatsDashboard } from '@/components/TimeStatsDashboard';
import { FriendsComparisonChart } from '@/components/FriendsComparisonChart';
import { GameStatus } from '@/components/GameStatus';
import { checkAchievements, updateRankings, awardPoints } from '@/lib/gameSystem';

export default function Home() {
  const { user, setUser, userData, setUserData, fetchUserData, updateBlock } = useStore();
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'warning' | 'default' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({ title: '', description: '' });
  const [showBirthDateInput, setShowBirthDateInput] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // 팝업 설정
      provider.setCustomParameters({
        prompt: 'select_account',
        display: 'popup'
      });

      // 팝업 차단 우회를 위한 설정
      const result = await signInWithPopup(auth, provider).catch(async (error) => {
        if (error.code === 'auth/popup-blocked') {
          setToast({
            message: '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.',
            variant: 'warning'
          });
          return null;
        }
        throw error;
      });

      if (!result) return;

      const user = result.user;

      // Firestore에 사용자 정보 저장
      const userData: UserData = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        blocks: {},
        gameStats: {
          level: 1,
          experience: 0,
          points: 0,
          achievements: [],
        },
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      setUser(user);
      setUserData(userData);
      setShowBirthDateInput(true);

      setToast({
        message: '로그인에 성공했습니다!',
        variant: 'success'
      });
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      setToast({
        message: '로그인에 실패했습니다.',
        variant: 'error'
      });
    }
  };

  const handleBirthDateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !userData) return;

    const formData = new FormData(e.currentTarget);
    const birthDate = new Date(formData.get('birthDate') as string);

    try {
      // 생년월일만 업데이트
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        birthDate,
        updatedAt: new Date(),
      });

      setUserData({ ...userData, birthDate });
      setShowBirthDateInput(false);
      setToast({
        message: '생년월일이 저장되었습니다!',
        variant: 'success'
      });
    } catch (error) {
      console.error('생년월일 저장 중 오류 발생:', error);
      setToast({
        message: '생년월일 저장에 실패했습니다.',
        variant: 'error'
      });
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
    setUserData(null);
    setToast({
      message: '로그아웃되었습니다.',
      variant: 'default'
    });
  };

  const handleAddBlock = async () => {
    if (!user || !userData || !newBlock.title) return;

    const blockId = `block_${Date.now()}`;
    const block: Block = {
      id: blockId,
      title: newBlock.title,
      description: newBlock.description,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await updateBlock(blockId, block);
      
      // 활동 기록
      await recordActivity({
        userId: user.uid,
        userName: userData.name,
        userPhotoURL: userData.photoURL,
        type: 'goal_created',
        content: createActivityContent('goal_created', {
          goalId: blockId,
          goalTitle: block.title,
        }),
        metadata: {
          goalId: blockId,
          goalTitle: block.title,
        },
      });

      // 포인트 및 경험치 지급
      await awardPoints(user.uid, userData, 50, 20);

      // 업적 체크
      const newAchievements = await checkAchievements(user.uid, userData);
      if (newAchievements.length > 0) {
        setToast({
          message: `새로운 업적을 달성했습니다: ${newAchievements.map(a => a.title).join(', ')}`,
          variant: 'success'
        });
      }

      // 랭킹 업데이트
      await updateRankings(user.uid, userData);

      setNewBlock({ title: '', description: '' });
      setShowAddBlock(false);
      setToast({
        message: '블록이 추가되었습니다!',
        variant: 'success'
      });
    } catch (error) {
      console.error('블록 추가 중 오류 발생:', error);
      setToast({
        message: '블록 추가에 실패했습니다.',
        variant: 'error'
      });
    }
  };

  const handleNotificationAction = async (notification: Notification) => {
    switch (notification.action?.type) {
      case 'accept_friend':
        if (notification.action.data?.friendId) {
          // 친구 요청 수락 로직
          try {
            const updatedFriends = [...(userData?.friends || []), notification.action.data.friendId];
            const updatedUserData: UserData = {
              ...userData!,
              friends: updatedFriends,
              updatedAt: new Date(),
            };

            await setDoc(doc(db, 'users', user!.uid), updatedUserData, { merge: true });
            setUserData(updatedUserData);

            setToast({
              message: '친구 요청을 수락했습니다!',
              variant: 'success'
            });
          } catch (error) {
            console.error('친구 요청 수락 중 오류 발생:', error);
            setToast({
              message: '친구 요청 수락에 실패했습니다.',
              variant: 'error'
            });
          }
        }
        break;

      case 'view_goal':
        if (notification.action.data?.goalId) {
          // 목표 보기 로직 (스크롤 등)
          const goalElement = document.getElementById(notification.action.data.goalId);
          if (goalElement) {
            goalElement.scrollIntoView({ behavior: 'smooth' });
            goalElement.classList.add('highlight');
            setTimeout(() => goalElement.classList.remove('highlight'), 2000);
          }
        }
        break;

      case 'send_cheer':
        // 응원 메시지 보내기 로직
        break;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        await fetchUserData(user.uid);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserData, fetchUserData]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p>로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        {user && userData ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full flex justify-between items-center">
              <p>안녕하세요, {userData.name || user.email}님!</p>
              <div className="flex items-center gap-4">
                <NotificationCenter
                  userId={user.uid}
                  onAction={handleNotificationAction}
                />
                <Button onClick={handleLogout}>로그아웃</Button>
              </div>
            </div>
            
            {showBirthDateInput ? (
              <form onSubmit={handleBirthDateSubmit} className="w-full max-w-md">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-4">생년월일을 입력해주세요</h3>
                  <input
                    type="date"
                    name="birthDate"
                    required
                    className="w-full mb-4 p-2 border rounded"
                  />
                  <Button type="submit">저장하기</Button>
                </div>
              </form>
            ) : userData.birthDate ? (
              <AgeCalculator birthDate={userData.birthDate} />
            ) : (
              <Button onClick={() => setShowBirthDateInput(true)}>
                생년월일 입력하기
              </Button>
            )}

            <div className="w-full max-w-md">
              <GameStatus gameStats={userData.gameStats} />
            </div>

            <div className="w-full max-w-md space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">나의 블록</h2>
                  <Button
                    onClick={() => setShowAddBlock(!showAddBlock)}
                    variant="outline"
                  >
                    {showAddBlock ? '취소' : '블록 추가'}
                  </Button>
                </div>

                {showAddBlock && (
                  <div className="mb-4 p-4 border rounded-lg">
                    <input
                      type="text"
                      placeholder="블록 제목"
                      className="w-full mb-2 p-2 border rounded"
                      value={newBlock.title}
                      onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                    />
                    <textarea
                      placeholder="블록 설명 (선택사항)"
                      className="w-full mb-2 p-2 border rounded"
                      value={newBlock.description}
                      onChange={(e) => setNewBlock({ ...newBlock, description: e.target.value })}
                    />
                    <Button
                      onClick={handleAddBlock}
                      disabled={!newBlock.title}
                      className="w-full"
                    >
                      추가하기
                    </Button>
                  </div>
                )}

                {Object.entries(userData.blocks).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(userData.blocks).map(([id, block]) => (
                      <div key={id} className="border p-4 rounded">
                        <h3 className="font-semibold">{block.title}</h3>
                        {block.description && (
                          <p className="text-gray-600 mt-1">{block.description}</p>
                        )}
                        <div className="mt-2">
                          <div className="bg-gray-200 h-2 rounded-full">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${block.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-sm text-gray-600">
                              진행률: {block.progress}%
                            </p>
                            <div className="space-x-2">
                              <Button
                                onClick={() => updateBlock(id, { progress: Math.max(0, block.progress - 10) })}
                                variant="outline"
                                size="sm"
                              >
                                -10%
                              </Button>
                              <Button
                                onClick={() => updateBlock(id, { progress: Math.min(100, block.progress + 10) })}
                                variant="outline"
                                size="sm"
                              >
                                +10%
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">아직 블록이 없습니다.</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">목표 진행률</h2>
                <GoalProgressChart blocks={userData.blocks} />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">통계 대시보드</h2>
                <TimeStatsDashboard blocks={userData.blocks} />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">친구들과 비교</h2>
                <FriendsComparisonChart
                  userId={user.uid}
                  userData={userData}
                  friends={userData.friends || []}
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">친구들의 활동</h2>
                <ActivityFeed
                  userId={user.uid}
                  friends={userData.friends || []}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p>로그인하여 시작하세요</p>
            <Button onClick={handleGoogleLogin}>Google로 로그인</Button>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}
