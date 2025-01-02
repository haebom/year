importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

firebase.initializeApp({
  apiKey: "AIzaSyB73bnwE9jTVqiTAvb2BvginUFAgvAcZtw",
  authDomain: "blocks-1b622.firebaseapp.com",
  projectId: "blocks-1b622",
  storageBucket: "blocks-1b622.firebasestorage.app",
  messagingSenderId: "486313931623",
  appId: "1:486313931623:web:2c81258f6c05e2bb8d75c2",
  measurementId: "G-QZH0VBXH25"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 