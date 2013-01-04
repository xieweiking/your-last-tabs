var DEFAULT_OPTIONS = {
    MAX_RECORD_COUNT: 60,
    IN_BLANK: false,
    STANDING: false,
    ALWAYS_APPEAR: true
};

function get_options(callback) {
    chrome.storage.sync.get('OPTIONS', function (items) {
        var options = items.OPTIONS;
        if (options == null) {
            options = DEFAULT_OPTIONS;
        }
        callback(options);
    });
}
