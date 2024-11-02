self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');   

});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        var fetchPromise = fetch(event.request, {cache: "reload"})
            .then(function(response) {
              console.log('Fetched from network:', event.request.url);
              return caches.open('konryd_feedback_cache')
                .then(function(cache) {
                  cache.put(event.request, response.clone()); 
                  return response;
                });
            });

        if (response) {
          console.log('Serving from cache:', event.request.url);
          event.waitUntil(fetchPromise);
          return response; 
        } else {
          return fetchPromise;
        }
      })
  );
});
