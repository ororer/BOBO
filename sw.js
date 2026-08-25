// Service Worker עבור BOBO
const CACHE_NAME = 'bobo-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// האזנה לקבלת התראת פוש מהשרת
self.addEventListener('push', (event) => {
  let data = {
    title: 'בובו 👶',
    body: 'עודכנה פעולה חדשה!'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// פתיחת האפליקציה בלחיצה על ההתראה
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('./');
    })
  );
});
