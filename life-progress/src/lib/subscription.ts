'use client';

import { collection, addDoc, deleteDoc, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notification';
import type { UserData } from '@/types';

interface Subscription {
  id: string;
  userId: string;
  targetUserId: string;
  createdAt: Date;
}

// 구독하기
export async function subscribeToUser(
  userId: string,
  userData: UserData,
  targetUserId: string
): Promise<void> {
  try {
    // 구독 정보 저장
    const subscription: Omit<Subscription, 'id'> = {
      userId,
      targetUserId,
      createdAt: new Date(),
    };
    
    await addDoc(collection(db, 'subscriptions'), subscription);

    // 구독 알림 보내기
    await createNotification({
      userId: targetUserId,
      senderId: userId,
      senderName: userData.name,
      senderPhotoURL: userData.photoURL,
      title: '새로운 구독자',
      message: `${userData.name}님이 회원님의 목표를 구독하기 시작했습니다.`,
      type: 'system',
    });
  } catch (error) {
    console.error('구독 중 오류 발생:', error);
    throw error;
  }
}

// 구독 취소
export async function unsubscribeFromUser(
  userId: string,
  targetUserId: string
): Promise<void> {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId),
      where('targetUserId', '==', targetUserId)
    );

    const snapshot = await getDocs(q);
    const subscriptionDoc = snapshot.docs[0];
    
    if (subscriptionDoc) {
      await deleteDoc(doc(db, 'subscriptions', subscriptionDoc.id));
    }
  } catch (error) {
    console.error('구독 취소 중 오류 발생:', error);
    throw error;
  }
}

// 구독 상태 확인
export async function checkSubscriptionStatus(
  userId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId),
      where('targetUserId', '==', targetUserId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('구독 상태 확인 중 오류 발생:', error);
    return false;
  }
}

// 구독자 목록 가져오기
export async function getSubscribers(userId: string): Promise<Subscription[]> {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('targetUserId', '==', userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    } as Subscription));
  } catch (error) {
    console.error('구독자 목록 가져오기 중 오류 발생:', error);
    return [];
  }
}

// 구독 중인 사용자 목록 가져오기
export async function getSubscriptions(userId: string): Promise<Subscription[]> {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    } as Subscription));
  } catch (error) {
    console.error('구독 목록 가져오기 중 오류 발생:', error);
    return [];
  }
} 