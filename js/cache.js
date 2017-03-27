
cacheStorage = {

};

function getCachedValue(cacheId, key, onSuccess, fn) {
    if (!cacheStorage[cacheId]) {
        cacheStorage[cacheId] = {};
    }
    var cache = cacheStorage[cacheId];

    if (cache[key]) {
        onSuccess(cache[key]);
    } else {
        fn(key, function(result) {
            cache[key] = result;
            onSuccess(result);
        });
    }
}