# The Benefits of Offline First #

The scope defines which pages the service worker will control. Eg ``` scope:'/my-app/'``` control everything under /my-app/, /my-app/hello. It wont control /,/another-app/ or /my-app, since it doesnt have a trailing slash.

It is possible to have different service workers.

Since some of the browser doesnt support service workers the code should be inside a conditional checking for the service worker ```if(navigator.serviceWorker)```

Registering a service worker

```
IndexController.prototype._registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('./sw.js')
    .then(() => {
      console.log('Registration Worked!!');
    }).catch(() => {
      console.log('Registration Faileed!!');
    })
}
```


Changing all the requests to a different gif

```
self.addEventListener('fetch', (event) => {

    if (event.request.url.endsWith('.jpg')) {
        event.respondWith(
            fetch('./imgs/dr-evil.gif')
        );
    }
});
```

Adding messages when fetch was not found
```
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).then(function (response) {
            if (response.status == 404) {
                return new Response('Whoops, not found');
            }
            return response;
        }).catch(() => {
            return new Response('uh oh, that totally failed');
        })
    )
});
```

Responding to 404 with a gif
```
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).then((response) => {
            if (response.status === 404) {
                return fetch('/imgs/dr-evil.gif');
            }
            return response;
        }).catch(() => {
            return new Response('uh oh, that totally failed');
        })
    )
});
```

Caching the static content
```
const staticCacheName = 'wittr-static-v1';
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName)
        .then((cache) => {
            var urlsToCache = [
                '/',
                'js/main.js',
                'css/main.css',
                'imgs/icon.png',
                'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
                'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
            ];
            cache.addAll(urlsToCache);
        })
    );
})
```