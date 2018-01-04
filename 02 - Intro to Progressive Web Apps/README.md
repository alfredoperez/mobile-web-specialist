# Lesson 01 - Intro to Progrseeive Web Apps #

*App Shell*

What goes in App shell?
It should have the all of the resources needed to get the app on screen as quicky as possible. That means some of JS, Html, CSS and images. 
Shell should be able to load without requesting data to the server.

*Storage*

Local Storage 
* Easy to use key/value
* Can only store strings
* Syncronous
* Transactional - you can override data

*Caches Object*

* Easy to Use
* Asyncronous
* Fast
* Transactional
* not supported in all browsers

*IndexedDB*
* Fast
* Complex data
* Asyncronous
* Transactional
* Available everywhere
* Ugly API.

# Lesson 02 - Service Workers #

A service worker is a javascript file that the browser runs in the background, separate from a web page, opening the door to features that don't need a web page or user interaction. Today, they already include features like push notifications and background sync. In the future, service workers will support other things like periodic sync or geofencing.

## Lifecycle ##

Installing-> Activated -> Idle ( Fetch - Push/Message - Deactivate)

## HTTPS ##
Service worker needs HTTPS, and this is beacause service worker can intercept network requests and modify them.

## Registering the service worker ##

```
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/service-worker.js')
        .then(
            function(registration){
                console.log('Service Worker Registered', registration);
            }
        );
}

```

## Service Worker Scope ##

When a service worker is registered it's limited to the scope provided, meaning that will only handle requests within the scope. If it is registered  in 'folder/sw.js' it will only handle request under '/folder'

## Debugging tips ## 
- Run in incognito in order to get new service worker every time
- Use 'chrome://serviceworker-internals' to manage the service worker
- Chrome Dev Tools > Resources Tab
- To remove all storage go toChrome > Settings > Cookies 

## Caching the App Shell on Install ##
```
var cacheName = `weatherPWA`;
var filesToCache = [...];
self.addEventListener('install', function(e){
    e.waitUntil(
        caches.open(cacheName).then(function(cache){
            
            // cache.addAll is atomic. 
            // If any of the files fail it will fail the whole add all
            return cache.addAll(filesToCache);
        })
    )
})
```

## Updating the cache ##

Since the browser doesnt know when the cached files where updated, the app needs to handle this and the perfect moment to do it is during the 'Activated' event.

In order to know if it is a new cache the application needs to check the cache name that was created during the installation event. 

This means, that the **app needs a new cache key/name** every time it requires to reload files.

```

self.addEventListener('activate', function(e){
    e.waitUntil(
        caches.keys().then(function(keyList){
            
     
            return Promise.all(keyList.map(function(key){
                if(key !== cacheName && key !== dataCacheName){
                    return caches.delete(key);
                }
            
            }));
        })
    )
})
```

## Get the App Shell from the cache ##

Intercepting service requests and serving them from the cache
```
self.addEventListener('fetch', function(e){
    
    e.respondWith(
        // Evaluates request and check if it is available in the cache
        caches.match(e.request).then(function(response){
            
            // Returns the resource from cached version 
            // or uses fetch to get it from the network
            return response || fetch(e.request);
        })
    )
})
```

## Caching Strategies ##
There are handful of caching strategies

### Cache First, then Network ###
Is ideal for storing commonly used resources, such as storing the key components of the app shell. Be careful when using this strategy for resources that change frequently or data, otherwise you might get stale data

### Network First, then Cache ###
This is the strategy to use for basic read-throug caching. It's also good to use for API requests where you always want the freshest data when is available but you would rather have stale data than not data at all.

This method has the  flaw that when  user has intermittent connection, the network trequest has to fail before getting content from cache

Network first is ideal for content that isupadted frequently and not part of the app shell

### Cache Only ###
Tries to resolve from the cache and if there is nothing it fails. This option is good when we need to guarantee that no network request will be made

### Network Only ###
Tries to handle the reuqest from the network. This is ideal for things that doesnt have an offline equivalent like Analytics.

### Cache and network Race (aka.fastest) ###
Request the resource from cache and network parallelly. Responds with whoever finishes first.

### Cache Then Network ###
Is ideal for data that data is updated quickly or when it is important to get data on-screen as quicky as possible.

### Example ###
For the weather app, the 'Cache then Network' strategy is the best.

```

// sw.js
onFetch = function(e){
    var url = e.request.url;
    // get data from cache
    if(url == "app.html"){
        e.respondWith(
            caches.match(e.request)
        );
    }

    if(url == "content.json"){
        
        // go to the network for updates
        // then cache response and return
        e.respondWith(
            fetch('').then(function(r){
                cache.put(url, r.clone);
                return r;
            })
        );
    }
};

```

This on the weather app will be:
```
  // Gets a forecast for a specific city and update the card with the data
  app.getForecast = function (key, label) {
    var url = weatherAPIUrlBase + key + '.json';
    if ('caches' in window) {
      caches.match(url).then(function (response) {
        if (response) {
          response.json().then(function (json) {

            // Only update if the XHR is still pending, otherwise the XHR
            // has already returned and provided the latest data
            if (app.hasRequestPending) {
              console.log('updated from cache');
              json.key = key;
              json.label = label;
              app.updateForecastCard(json);
            }

          })
        }
      })
    }

    // Make the XHR to get the data, then update the card
    app.hasRequestPending = true;
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          response.key = key;
          response.label = label;
          app.hasRequestPending = false;
          app.updateForecastCard(response);
        }
      }
    };
    request.open('GET', url);
    request.send();
  };
```
It is a good practice to keep the resources from the app sheel separate from the application data, in order to update one without disturbing the other.
This can be achieved by adding a conditional in the 'fetch' event to behave differently wether the call is to the data api or for shell resources.

## sw-precache ##
Service worker precache is a node module to automatically generate a service worker that will precache the AppShell resource. By adding a few extra configuration parameters, it is possible to add runtime caching options that can be used to handle application data.

If it is included in the build script it will run and find file changes.

```
var swOptions = {
    staticFileGlobs:[
        './*.html',
        './images/*.{png,svg,gif,jpg},
        './scripts/**/*.js',
        './styles/**/*.css'
    ],
    scriptPrefix: '.',
    runtimeCaching:[{
        urlPattern: /^htttps:\/\/publicdata-weather\.firebaseio\.com/,
        handler: 'networkFirst',
        options:{
            cache:{
                name: 'weatherData'
            }
        }
    }]
    };
```

# Lesson 3: Web App Manifest #
The web app manifest is a simple JSON file that gives you, the developer, the ability to control how your app appears to the user in areas where they would expect to see apps (for example, a mobile device's home screen), direct what the user can launch, and define its appearance at launch.

Web app manifests provide the ability to save a site bookmark to a device's home screen. When a site is launched this way:

- It has a unique icon and name so that users can distinguish it from other sites.
- It displays something to the user while resources are downloaded or restored from cache.
- It provides default display characterstics to the browser to avoid too abrupt transition when site resources become available.
- It does all this through the simple mechanism of metadata in a text file. That's the web app manifest.

Recommended to get 8 icon sizes-> 48, 96, 128, 144, 192, 256, 384 and 512px

Manifest Validator
https://manifest-validator.appspot.com/

Manifest Generator
https://app-manifest.firebaseapp.com/

## Web app install banners ##
Give the ability to quickly and seamlessly add the web app to home screen. Chrome checks service worker, web app manigest file and an engaged user.

## Add to homescreen in Safari ##
Safari looks for meta tags in the document head.

### - Icons - ###
 to cover all current devices use the following sizes: 60,76, 120, 152, 167, and 180 px 
```
<link rel="apple-touch-icon" sizes="60x60" href="apple-60.png">
```
### - Hide Browser - ###
To hide the browser UI components, add the following meta:

```
<meta name="apple-mobile-web-app-capable" content="yes">
```

## - Minimize Status Bar - ##

```
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

## Deploy To An HTTPS Host ##
The Firebase commands run in this example are:

firebase login to authenticate with Firebase
firebase init to initialize our Firebase project
firebase deploy to upload our application to Firebase