var cacheName = `weatherPWA-v2`;
var dataCacheName = `weatherPWAData-v2`;

var filesToCache = [
    '/',
    '/index.html',
    '/images/clear.png',
    '/images/partly-cloudy.png',
    '/images/clear.png',
    '/images/snow.png',
    '/images/sleet.png',
    '/images/fog.png',
    '/images/wind.png',
    '/scripts/app.js',
    '/scripts/localforage.min.js',
    '/styles/ud811.css'
];
var weatherAPIUrlBase = 'https://publicdata-weather.firebaseio.com/';

self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[Service Worker] Caching App Shell');
            // cache.addAll is atomic. 
            // If any of the files fail it will fail the whole add all
            return cache.addAll(filesToCache);
        })
    )
})

self.addEventListener('activate', function (e) {
    console.log('[Service Worker] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName && key !== dataCacheName) {
                    console.log('[Service Worker] removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    )
})

self.addEventListener('fetch', function (e) {
    console.log('[Service Worker] Fetch', e.request.url);
    // check if the request is to the weather api
    if (e.request.url.startsWith(weatherAPIUrlBase)) {
        e.respondWith(
            fetch(e.request)
                .then(function (response) {
                    // opening the cache with data
                    return caches.open(dataCacheName).then(function (cache) {
                        cache.put(e.request.url, response.clone());
                        console.log('[Service Worker] Fetched and Cached Data!');
                    });
                })
        )
    } else {
        e.respondWith(

            // Evaluates request and check if it is available in the cache
            caches.match(e.request).then(function (response) {
                console.log('[Service Worker] Fetch Only!', e.request.url);
                // Returns the resource from cached version 
                // or uses fetch to get it from the network
                return response || fetch(e.request);
            })
        )
    }

})