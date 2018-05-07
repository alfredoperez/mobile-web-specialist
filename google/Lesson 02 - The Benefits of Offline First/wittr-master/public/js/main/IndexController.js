import PostsView from './views/Posts';
import ToastsView from './views/Toasts';
import idb from 'idb';

function openDatabase() {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  // Return a promise for a database called 'wittr'
  // that contains one objectStore: 'wittrs'
  // that uses 'id' as its key
  // and has an index called 'by-date', which is sorted
  // by the 'time' property
  var dbPromise = idb.open('wittr', 1, (upgradeDb) => {
    switch (upgradeDb.oldVersion) {
      case 0:
        var keyValStore = upgradeDb.createObjectStore('wittrs', {
          keyPath: 'id'
        });
        keyValStore.createIndex('by-date', 'time');
    }
  });
  return dbPromise;
}

export default function IndexController(container) {
  this._container = container;
  this._postsView = new PostsView(this._container);
  this._toastsView = new ToastsView(this._container);
  this._lostConnectionToast = null;
  this._openSocket();
  this._dbPromise = openDatabase();
  this._registerServiceWorker();
  this._cleanImageCache();
  var indexController = this;

  // Clean image cache every 5 min
  setInterval(() => {
    indexController._cleanImageCache();
  }, 1000 * 60 * 5);

  this._showCachedMessages().then(() => {
    indexController._openSocket();
  });
}

IndexController.prototype._registerServiceWorker = function () {
  if (!navigator.serviceWorker) return;

  var indexController = this;

  navigator.serviceWorker.register('/sw.js').then(function (reg) {
    if (!navigator.serviceWorker.controller) {
      return;
    }

    if (reg.waiting) {
      indexController._updateReady(reg.waiting);
      return;
    }

    if (reg.installing) {
      indexController._trackInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', function () {
      indexController._trackInstalling(reg.installing);
    });
  });

  // listen for the controlling service worker changing
  // and reload the page
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    location.reload();
  })
};

IndexController.prototype._trackInstalling = function (worker) {
  var indexController = this;
  worker.addEventListener('statechange', function () {
    if (worker.state == 'installed') {
      indexController._updateReady(worker);
    }
  });
};

IndexController.prototype._updateReady = function (worker) {
  var toast = this._toastsView.show("New version available", {
    buttons: ['refresh', 'dismiss']
  });

  toast.answer.then(function (answer) {
    if (answer != 'refresh') return;
    //  Tell the service worker to skipWaiting
    worker.postMessage({
      skipWaiting: true
    });
  });
};

IndexController.prototype._showCachedMessages = function () {
  var indexController = this;

  return this._dbPromise.then(function (db) {
    // if we're already showing posts, eg shift-refresh
    // or the very first load, there's no point fetching
    // posts from IDB
    if (!db || indexController._postsView.showingPosts()) return;

    // Get all of the wittr message objects from indexeddb,
    // then pass them to:
    // indexController._postsView.addPosts(messages)
    // in order of date, starting with the latest.
    // Remember to return a promise that does all this,
    // so the websocket isn't opened until you're done!
    var timeIndex = db.transaction('wittrs')
      .objectStore('wittrs')
      .index('by-date');

    return timeIndex.getAll()
      .then((messages) => {
        indexController._postsView.addPosts(messages.reverse());
      });

  })
};

// open a connection to the server for live updates
IndexController.prototype._openSocket = function () {
  var indexController = this;
  var latestPostDate = this._postsView.getLatestPostDate();

  // create a url pointing to /updates with the ws protocol
  var socketUrl = new URL('/updates', window.location);
  socketUrl.protocol = 'ws';

  if (latestPostDate) {
    socketUrl.search = 'since=' + latestPostDate.valueOf();
  }

  // this is a little hack for the settings page's tests,
  // it isn't needed for Wittr
  socketUrl.search += '&' + location.search.slice(1);

  var ws = new WebSocket(socketUrl.href);

  // add listeners
  ws.addEventListener('open', function () {
    if (indexController._lostConnectionToast) {
      indexController._lostConnectionToast.hide();
    }
  });

  ws.addEventListener('message', function (event) {
    requestAnimationFrame(function () {
      indexController._onSocketMessage(event.data);
    });
  });

  ws.addEventListener('close', function () {
    // tell the user
    if (!indexController._lostConnectionToast) {
      indexController._lostConnectionToast = indexController._toastsView.show("Unable to connect. Retrying…");
    }

    // try and reconnect in 5 seconds
    setTimeout(function () {
      indexController._openSocket();
    }, 5000);
  });
};
IndexController.prototype._cleanImageCache = function () {
  return this._dbPromise.then(function (db) {
    if (!db) return;

    // Open the 'wittr' object store, get all the messages,
    // gather all the photo urls.
    //
    // Open the 'wittr-content-imgs' cache, and delete any entry
    // that you no longer need.
    var imagesNeeded = [];
    var tx = db.transaction('wittrs');
    return tx
      .objectStore('wittrs').getAll().then((messages) => {
        messages.forEach((message) => {
          if (message.photo) {
            imagesNeeded.push(message.photo);
          }
          // keeping all the avatar images
          imagesNeeded.push(message.avatar);
        });

        return caches.open('wittr-content-imgs');
      })
      .then(function (cache) {
        return cache.keys().then((requests) => {
          requests.forEach((request) => {
            var url = new URL(request.url);

            if (!imagesNeeded.includes(url.pathname)) {
              console.log('Deleting Cache -> ', url.pathname);
              cache.delete(request);
            }
          });
        });
      });
  });
};

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function (data) {
  var messages = JSON.parse(data);

  this._dbPromise.then(function (db) {
    if (!db) return;

    //  put each message into the 'wittrs'
    // object store.
    // update

    var tx = db.transaction('wittrs', 'readwrite');
    var keyValStore = tx.objectStore('wittrs');

    messages.forEach((message) => {
      keyValStore.put(message);
    })

    // Keep the newest 30 entries in 'wittrs',
    // but delete the rest.
    //
    // Hint: you can use .openCursor(null, 'prev') to
    // open a cursor that goes through an index/store
    // backwards.
    keyValStore.index('by-date')
      .openCursor(null, 'prev').then((cursor) => {
        if (!cursor) return;
        // This will skip the 30 first items
        return cursor.advance(30);
      }).then(function deleteItem(cursor) {
        if (!cursor) return;
        console.log('Cursor author --> ', cursor.value.name);
        console.log('Cursor time --> ', cursor.value.time);
        // delete until there is not iterator
        cursor.delete();
        return cursor.continue().then(deleteItem)
      });


  })

  this._postsView.addPosts(messages);
};