var DEFAULT_OPTIONS = {
    MAX_RECORD_COUNT: 60,
    IN_BLANK: false,
    STANDING: false,
    ALWAYS_APPEAR: true,
    ARRANGE: false
};

function guard_options(options) {
    if (options == null) {
        options = DEFAULT_OPTIONS;
    }
    return options;
}

function get_options(callback) {
    chrome.storage.local.get('OPTIONS', function (items) {
        if (typeof(callback) == 'function') {
            callback(guard_options(items.OPTIONS));
        }
    });
}
