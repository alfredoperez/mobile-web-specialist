const staticName = 'wittr-static-';
const contentImgsName = 'wittr-content-imgs-'
const version = 'vfinal';

const staticCache = staticName + version;
const contentImgsCache = 'wittr-content-imgs'; //contentImgsName + version;

const allCaches = [
    staticCache,
    contentImgsCache
];


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
    // Cache /skeleton rather than the root page

    event.waitUntil(
        caches.open(staticCache)
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

                    return cacheKey.startsWith('wittr-') &&
                        !allCaches.includes(cacheKey)
                }).map((cache) => {
                    console.log('[Service Worker] removing old cache', cache);
                    return caches.delete(cache);
                }));
        })
    )
});
self.addEventListener('fetch', (event) => {

    // respond to requests for the root page with
    // the page skeleton from the cache
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/') {
            event.respondWith(caches.match('/skeleton'));
            return;
        }
        if (requestUrl.pathname.startsWith('/photos/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
        // Respond to avatar urls by responding with
        // the return value of serveAvatar(event.request)
        if (requestUrl.pathname.startsWith('/avatars/')) {
            event.respondWith(serveAvatar(event.request));
            return;
        }
    }

    event.respondWith(

        // Evaluates request and check if it is available in the cache
        caches.match(event.request).then(function (response) {

            // console.log('[Service Worker] Fetch Only!', event.request.url);
            // Returns the resource from cached version 
            // or uses fetch to get it from the network
            return response || fetch(event.request);
        })
    )
});

function serveAvatar(request) {
    // Avatar urls look like:
    // avatars/sam-2x.jpg
    // But storageUrl has the -2x.jpg bit missing.
    // Use this url to store & match the image in the cache.
    // This means you only store one copy of each avatar.
    var storageUrl = request.url.replace(/-\dx\.jpg$/, '');

    // Return images from the "wittr-content-imgs" cache
    // if they're in there. But afterwards, go to the network
    // to update the entry in the cache.
    //
    // Note that this is slightly different to servePhoto!
    return caches.open(contentImgsCache).then((cache) => {
        return cache.match(storageUrl).then((response) => {
            var fetchPromise = fetch(request).then((networkResponse) => {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });

            return response || fetchPromise;
        });
    });
}

function servePhoto(request) {
    // Photo urls look like:
    // /photos/9-8028-7527734776-e1d2bda28e-800px.jpg
    // But storageUrl has the -800px.jpg bit missing.
    // Use this url to store & match the image in the cache.
    // This means you only store one copy of each photo.
    var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');
    // return images from the "wittr-content-imgs" cache
    // if they're in there. Otherwise, fetch the images from
    // the network, put them into the cache, and send it back
    // to the browser.
    //
    // HINT: cache.put supports a plain url as the first parameter


    return caches.open(contentImgsCache).then((cache) => {
        return caches.match(storageUrl).then((response) => {

            return response ||
                fetch(request).then((networkResponse) => {
                    console.log('Storing->', storageUrl);
                    cache.put(storageUrl, networkResponse.clone());
                    return networkResponse;
                })
        })
    })

}
//listen for the 'message' event and call skipwaiting 
// if you get the appropiate message
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message =>', event.data);
    if (event.data !== null && event.data.skipWaiting) {
        self.skipWaiting();
    }
})