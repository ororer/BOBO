self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// קבלת התראה משרתי הדחיפה (Apple / Google) גם כשהמסך נעול והאפליקציה סגורה
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'בובו - תזכורת האכלה 🍼', body: event.data.text() };
    }
  }

  const title = data.title || '🍼 זמן האכלה של בובו!';
  const options = {
    body: data.body || 'הגיע הזמן לארוחה הבאה.',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍼</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍼</text></svg>',
    tag: 'bobo-feed-alert',
    renotify: true,
    data: { url: './' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// לחיצה על ההתראה מחזירה ישירות לאפליקציה
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
