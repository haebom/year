// Firebase SDK 초기화
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, updateDoc, getDoc, query, where, getDocs, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

// Firebase 구성
const firebaseConfig = {
  apiKey: "AIzaSyB73bnwE9jTVqiTAvb2BvginUFAgvAcZtw",
  authDomain: "blocks-1b622.firebaseapp.com",
  projectId: "blocks-1b622",
  storageBucket: "blocks-1b622.firebasestorage.app",
  messagingSenderId: "486313931623",
  appId: "1:486313931623:web:2c81258f6c05e2bb8d75c2",
  measurementId: "G-QZH0VBXH25"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let messaging = null;

// Firebase 초기화 함수
async function initializeFirebase() {
  try {
    // Firestore 오프라인 지원 활성화
    await enableIndexedDbPersistence(db);

    // Firebase Messaging 초기화
    if ('Notification' in window) {
      try {
        messaging = getMessaging(app);
        if (Notification.permission === 'granted') {
          await initializeMessaging();
        }
      } catch (error) {
        console.log('Messaging is not supported in this browser');
      }
    }

    // 인증 상태 관찰자 설정
    onAuthStateChanged(auth, handleAuthStateChanged);

    return true;
  } catch (error) {
    console.error('Firebase 초기화 에러:', error);
    showToast('앱 초기화 중 오류가 발생했습니다.');
    return false;
  }
}

// Messaging 초기화 함수
async function initializeMessaging() {
  try {
    if (!messaging) return false;

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/year/firebase-messaging-sw.js', {
        scope: '/year/',
        type: 'module'
      });
      
      console.log('ServiceWorker 등록 성공:', registration.scope);

      const currentToken = await getToken(messaging, {
        vapidKey: 'BP4wdRA9DJ899-SilAiy_Qiu_idCev8FpbgYnALT7_n-XjfxLnjAHSXvYraMVRoK4dN09b55Abd-AV4X_zO3jrI',
        serviceWorkerRegistration: registration
      });

      if (currentToken && auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          fcmToken: currentToken
        });
      }

      // 포그라운드 메시지 핸들러
      onMessage(messaging, (payload) => {
        console.log('포그라운드 메시지 수신:', payload);
        showToast(payload.notification.title);
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error('Messaging 초기화 에러:', error);
    return false;
  }
}

// 인증 상태 변경 핸들러
async function handleAuthStateChanged(user) {
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const userInfo = document.getElementById('userInfo');
  const questContainer = document.getElementById('questContainer');
  const initialSetupModal = document.getElementById('initialSetupModal');

  if (user) {
    // 사용자가 로그인한 경우
    loginButton.style.display = 'none';
    logoutButton.style.display = 'block';
    userInfo.style.display = 'block';
    questContainer.style.display = 'block';

    // 사용자 정보 업데이트
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || !userDoc.data().birthDate) {
      initialSetupModal.style.display = 'block';
    } else {
      updateProgress(userDoc.data());
    }

    // FCM 토큰 업데이트
    if (messaging) {
      try {
        const currentToken = await getToken(messaging);
        if (currentToken) {
          await updateDoc(doc(db, 'users', user.uid), {
            fcmToken: currentToken
          });
        }
      } catch (error) {
        console.error('FCM 토큰 업데이트 실패:', error);
      }
    }
  } else {
    // 사용자가 로그아웃한 경우
    loginButton.style.display = 'block';
    logoutButton.style.display = 'none';
    userInfo.style.display = 'none';
    questContainer.style.display = 'none';
    initialSetupModal.style.display = 'none';
  }
}

// 로그인 함수
window.googleLogin = async function() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    await signInWithPopup(auth, provider);
    showToast('로그인되었습니다.');
  } catch (error) {
    console.error("로그인 에러:", error);
    showToast("로그인 중 오류가 발생했습니다.");
  }
};

// 로그아웃 함수
window.handleLogout = async function() {
  try {
    await signOut(auth);
    showToast('로그아웃되었습니다.');
    window.location.reload();
  } catch (error) {
    console.error("로그아웃 에러:", error);
    showToast("로그아웃 중 오류가 발생했습니다.");
  }
};

// 토스트 메시지 표시 함수
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// 진행률 업데이트 함수
function updateProgress(userData) {
  const progressBar = document.querySelector('.progress-bar');
  const progressText = document.querySelector('.progress-text');
  
  if (!progressBar || !progressText || !userData.birthDate) return;

  const now = new Date();
  const birthDate = new Date(userData.birthDate);
  const lifeExpectancy = userData.lifeExpectancy || 80;
  
  const age = (now - birthDate) / (1000 * 60 * 60 * 24 * 365.25);
  const progress = (age / lifeExpectancy) * 100;
  
  progressBar.style.width = `${Math.min(progress, 100)}%`;
  progressText.textContent = `인생의 ${progress.toFixed(2)}% 진행됨 (${Math.floor(age)}세)`;
}

// 초기 설정 저장 함수
window.saveInitialSetup = async function(event) {
  event.preventDefault();
  
  const user = auth.currentUser;
  if (!user) return;

  const birthDate = document.getElementById('initialBirthDate').value;
  const lifeExpectancy = parseInt(document.getElementById('initialLifeExpectancy').value);

  try {
    await setDoc(doc(db, 'users', user.uid), {
      birthDate: birthDate,
      lifeExpectancy: lifeExpectancy,
      email: user.email,
      setupCompleted: true,
      updatedAt: new Date()
    }, { merge: true });

    document.getElementById('initialSetupModal').style.display = 'none';
    showToast('설정이 저장되었습니다.');
    updateProgress({ birthDate, lifeExpectancy });
  } catch (error) {
    console.error('초기 설정 저장 에러:', error);
    showToast('설정 저장 중 오류가 발생했습니다.');
  }
};

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeFirebase();
  } catch (error) {
    console.error('앱 초기화 에러:', error);
    showToast('앱 초기화 중 오류가 발생했습니다.');
  }
}); 