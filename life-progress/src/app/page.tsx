'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import useStore from '@/store/useStore';
import { auth, db } from '@/lib/firebase';

export default function Home() {
  const { user, setUser } = useStore();
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'warning' | 'default' } | null>(null);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

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

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
    setToast({
      message: '로그아웃되었습니다.',
      variant: 'default'
    });
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        {user ? (
          <div className="flex flex-col items-center gap-4">
            <p>안녕하세요, {user.displayName || user.email}님!</p>
            <Button onClick={handleLogout}>로그아웃</Button>
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
