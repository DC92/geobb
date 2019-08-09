// The first time a user hits the page an install event is triggered.
self.addEventListener('install', function(e) {
	e.waitUntil(
		caches.open('myolCache').then(function(cache) {
			return cache.addAll([
				'./favicon.png',
				'./index.html',
				'../../ol/ol.css',
				'../../ol/ol.js',
				'../../myol.css',
				'../../myol.js'
			]);
		})
	);
});

// Remove old caches
self.addEventListener('activate', function(e) {
	e.waitUntil(
		caches.keys().then(function(keyList) {
			return Promise.all(keyList.map(function(key) {
				if (key !== 'myolCache') {
					return caches.delete(key);
				}
			}));
		})
	);
	return self.clients.claim();
});

/* The event.respondWith() method tells the browser to evaluate the result of the event in the future.
   caches.match(event.request) takes the current web request that triggered the fetch event and looks in the cache for a resource that matches.
   The match is performed by looking at the URL string.
   The match method returns a promise that resolves even if the file is not found in the cache. 
*/
self.addEventListener('fetch', function(e) {
	e.respondWith(
		caches.match(e.request).then(function(response) {
			return response || fetch(e.request);
		})
	);
});