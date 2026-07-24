const CACHE_NAME = 'bobo-cache-v17';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('בובו - במצב אופליין. אנא התחבר לאינטרנט.');
    })
  );
});