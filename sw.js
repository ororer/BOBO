self.addEventListener('install', (e) => { 
  self.skipWaiting(); 
});

self.addEventListener('activate', (e) => { 
  e.waitUntil(self.clients.claim()); 
});

// חובה עבור אנדרואיד/Chrome כדי לאפשר התקנת אפליקציה
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'בובו - מעקב תינוקות', body: 'זמן האכלה!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍼</text></svg>'
    })
  );
});
