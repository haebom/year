// Firebase SDK 가져오기
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 구성
firebase.initializeApp({
  apiKey: "AIzaSyB73bnwE9jTVqiTAvb2BvginUFAgvAcZtw",
  authDomain: "blocks-1b622.firebaseapp.com",
  projectId: "blocks-1b622",
  storageBucket: "blocks-1b622.firebasestorage.app",
  messagingSenderId: "486313931623",
  appId: "1:486313931623:web:2c81258f6c05e2bb8d75c2",
  measurementId: "G-QZH0VBXH25"
});

// Firebase Messaging 인스턴스 가져오기
const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/maskable_icon_x192.png',
    badge: '/maskable_icon_x192.png',
    tag: 'notification',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
}); 