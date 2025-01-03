'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import type { Friend, UserData } from '@/types';
import { createNotification } from '@/lib/notification';

interface FriendManagerProps {
  userId: string;
  userData: UserData;
  onUpdate?: () => void;
}

export function FriendManager({ userId, userData, onUpdate }: FriendManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);

  // 사용자 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '>=', searchQuery),
        where('email', '<=', searchQuery + '\uf8ff')
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }) as UserData)
        .filter(user => user.id !== userId);
      
      setSearchResults(results);
    } catch (error) {
      console.error('사용자 검색 중 오류 발생:', error);
    }
    setLoading(false);
  };

  // 친구 요청 보내기
  const handleSendRequest = async (friendId: string) => {
    try {
      // 친구 요청 생성
      const friendRequest: Friend = {
        id: `${userId}_${friendId}`,
        userId: userId,
        friendId: friendId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'friends'), friendRequest);

      // 알림 생성
      await createNotification({
        userId: friendId,
        senderId: userId,
        senderName: userData.name,
        senderPhotoURL: userData.photoURL,
        title: '새로운 친구 요청',
        message: `${userData.name}님이 친구 요청을 보냈습니다.`,
        type: 'friend_request',
        action: {
          type: 'accept_friend',
          data: {
            friendId: userId,
          },
        },
      });

      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('친구 요청 보내기 중 오류 발생:', error);
    }
  };

  // 친구 요청 수락
  const handleAcceptRequest = async (friendId: string) => {
    try {
      const friendRef = doc(db, 'friends', `${friendId}_${userId}`);
      await updateDoc(friendRef, {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });

      // 사용자의 친구 목록 업데이트
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        friends: [...(userData.friends || []), friendId],
      });

      onUpdate?.();
    } catch (error) {
      console.error('친구 요청 수락 중 오류 발생:', error);
    }
  };

  // 친구 요청 거절
  const handleRejectRequest = async (friendId: string) => {
    try {
      const friendRef = doc(db, 'friends', `${friendId}_${userId}`);
      await updateDoc(friendRef, {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });

      // 요청 목록에서 제거
      setPendingRequests(prev => prev.filter(req => req.userId !== friendId));

      // 알림 생성
      await createNotification({
        userId: friendId,
        senderId: userId,
        senderName: userData.name,
        senderPhotoURL: userData.photoURL,
        title: '친구 요청 결과',
        message: `${userData.name}님이 친구 요청을 거절했습니다.`,
        type: 'system',
      });
    } catch (error) {
      console.error('친구 요청 거절 중 오류 발생:', error);
    }
  };

  // 친구 요청 목록 가져오기
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const q = query(
          collection(db, 'friends'),
          where('friendId', '==', userId),
          where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Friend[];

        setPendingRequests(requests);
      } catch (error) {
        console.error('친구 요청 목록 가져오기 중 오류 발생:', error);
      }
    };

    if (activeTab === 'requests') {
      fetchPendingRequests();
    }
  }, [userId, activeTab]);

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이메일로 친구 찾기"
          className="flex-1 p-2 border rounded"
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
        >
          검색
        </Button>
      </div>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg divide-y">
          {searchResults.map((user) => (
            <div key={user.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <div className="relative w-10 h-10">
                    <Image
                      src={user.photoURL}
                      alt={user.name}
                      fill
                      className="rounded-full object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {user.name[0]}
                  </div>
                )}
                <div>
                  <Link href={`/profile/${user.id}`} className="font-semibold hover:underline">
                    {user.name}
                  </Link>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
              </div>
              <Button
                onClick={() => handleSendRequest(user.id)}
                variant="outline"
                size="sm"
              >
                친구 요청
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('friends')}
          className={`pb-2 px-1 ${
            activeTab === 'friends'
              ? 'border-b-2 border-blue-500 font-semibold'
              : 'text-gray-500'
          }`}
        >
          친구 목록
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2 px-1 ${
            activeTab === 'requests'
              ? 'border-b-2 border-blue-500 font-semibold'
              : 'text-gray-500'
          }`}
        >
          친구 요청
        </button>
      </div>

      {/* 친구 목록 */}
      {activeTab === 'friends' && (userData.friends?.length ?? 0) > 0 && (
        <div className="space-y-4">
          {userData.friends?.map((friendId) => (
            <div key={friendId} className="p-4 border rounded-lg">
              <Link href={`/profile/${friendId}`} className="font-semibold hover:underline">
                {friendId}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 친구 요청 목록 */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              새로운 친구 요청이 없습니다.
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold">{request.userId}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptRequest(request.userId)}
                    variant="default"
                    size="sm"
                  >
                    수락
                  </Button>
                  <Button
                    onClick={() => handleRejectRequest(request.userId)}
                    variant="outline"
                    size="sm"
                  >
                    거절
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 