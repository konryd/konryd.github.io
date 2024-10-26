self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');   

});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    console.log("request=",event.request);
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response; 
        } else {
          console.log('Fetching from network:', event.request.url);
          return fetch(event.request)
            .then(function(response) {
              return caches.open('konryd_feedback_cache')
                .then(function(cache) {
                  cache.put(event.request, response.clone()); 
                  return response;
                });
            });
        }
      })
  );
});
