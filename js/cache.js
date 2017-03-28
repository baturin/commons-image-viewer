/**
 * Cache to store data retrieved from remote APIs (Commons, Wikivoyage), based on:
 * - local storage (Web Storage API), as persistent cache, when available
 * - in memory cache, for current session till the next page reload.
 *
 * Avoid putting large structures to the cache as local storage has limited size.
 */
cacheStorage = {
    _data: {},

    /**
     * Set cache value
     *
     * @param cacheId string ID of cache (e.g. "category", "image-info", etc)
     * @param key string key of cache item (e.g. "Category:Zolotodolinskaya_street", "File:Novosibirsk3085.jpg", etc)
     * @param value any value that could be serialized by JSON
     */
    setValue: function(cacheId, key, value) {
        var fullKey = cacheId + "::" + key;
        this._data[fullKey] = value;

        if (window.localStorage) {
            try {
                window.localStorage.setItem(fullKey, JSON.stringify(value));
            } catch (e) {
                // do not fail whole application in case of any error with local storage cache,
                // for example if it is full
            }
        }
    },

    /**
     * Get cache value
     *
     * @param cacheId string ID of cache (e.g. "category", "image-info", etc)
     * @param key string key of cache item (e.g. "Category:Zolotodolinskaya_street", "File:Novosibirsk3085.jpg", etc)
     * @returns value if cache contains value for cacheId/key pair, otherwise null
     */
    getValue: function(cacheId, key) {
        var fullKey = cacheId + "::" + key;

        if (this._data[fullKey]) {
            return this._data[fullKey];
        } else if (window.localStorage) {
            var localStorageData = window.localStorage.getItem(fullKey);
            if (localStorageData !== null) {
                this._data[fullKey] = JSON.parse(localStorageData);
                return this._data[fullKey];
            }
        }

        return null;
    },

    /**
     * Clear the cache: both in-memory and Web Storage API.
     */
    clear: function() {
        if (window.localStorage) {
            window.localStorage.clear();
        }
        this._data = {};
        log.info("Cache was cleaned up");
    }
};

function getCachedValue(cacheId, key, onSuccess, fn) {
    if (cacheStorage.getValue(cacheId, key)) {
        onSuccess(cacheStorage.getValue(cacheId, key));
    } else {
        fn(key, function(result) {
            cacheStorage.setValue(cacheId, key, result);
            onSuccess(result);
        });
    }
}