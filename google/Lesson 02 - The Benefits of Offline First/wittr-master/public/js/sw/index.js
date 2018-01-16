const cacheName = 'wittr';
// s s s dddd  
const staticCacheName = cacheName + '-static-v4';

var urlsToCache = [
    '/skeleton',
    'js/main.js',
    'css/main.css',
    'imgs/icon.png',
    'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
    'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
];

//
self.addEventListener('install', (event) => {
    // TODO: cache /skeleton rather than the root page

    event.waitUntil(
        caches.open(staticCacheName)
        .then((cache) => {

            cache.addAll(urlsToCache);
        })
    );
})
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        // Get all the cache keys available
        caches.keys().then((cacheKeys) => {

            // Filter caches containing the first part of our cache name
            // and that are different to the current static cache name
            // Eg. 'wittr-static-v2' ~vs~ 'wittr-static-v3'
            return Promise.all(
                cacheKeys.filter((cacheKey) => {
                    return cacheKey.startsWith(cacheName) &&
                        cacheKey !== staticCacheName
                }).map((cache) => {
                    //  console.log('[Service Worker] removing old cache', cache);
                    return caches.delete(cache);
                }));
        })
    )
});
self.addEventListener('fetch', (event) => {

    // TODO: respond to requests for the root page with
    // the page skeleton from the cache
    var requestURL = new URL(event.request.url);
    if (requestURL.origin === location.origin) {
        if (requestURL.pathname === '/') {
            event.respondWith(caches.match('/skeleton'));
            return;
        }
    }

    event.respondWith(

        // Evaluates request and check if it is available in the cache
        caches.match(event.request).then(function (response) {
            //   console.log('[Service Worker] Fetch Only!', event.request.url);
            // Returns the resource from cached version 
            // or uses fetch to get it from the network
            return response || fetch(event.request);
        })
    )
});

//TODO: listen for the 'message' event and call skipwaiting 
// if you get the appropiate message
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message =>', event.data);
    if (event.data !== null && event.data.skipWaiting) {
        self.skipWaiting();
    }
})