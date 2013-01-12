var CHROME_INNER_URL_PATTERN = /^chrome(-.+)?\:\/\/.+/;
var NEWTAB = { url: 'chrome://newtab/', selected : false };
var NOT_PINED_TABS = { pinned: false };
var KEY_POSITIONS = 'KEY_POSITIONS';

function is_newtab(tab) {
    return tab.url == NEWTAB.url;
}

function has_last_tabs(items) {
    return items != null && items.KEY_YOUR_LAST_TABS != null && items.KEY_YOUR_LAST_TABS.length > 0;
}

function is_url_ok(url) {
    return url != null && url != '' && !CHROME_INNER_URL_PATTERN.test(url);
}

function save_all_windows_tabs() {
    chrome.tabs.query(NOT_PINED_TABS, function (tabs) {
        var current_tabs = [];
        var url_map = {};
        tabs.forEach(function (tab) {
            var url = tab.url;
            if (!url_map[url] && is_url_ok(url)) {
                var title = tab.title;
                current_tabs.push({ url: url, title: (title == null || title == '' ? url : title) });
                url_map[url] = true;
            }
        });
        get_options(function (options) {
            var diff = current_tabs.length - options.MAX_RECORD_COUNT;
            if (diff == 0) {
                chrome.storage.sync.set({ KEY_YOUR_LAST_TABS: current_tabs });
            }
            else if (diff > 0) {
                chrome.storage.sync.set({ KEY_YOUR_LAST_TABS: current_tabs.slice(diff, current_tabs.length) });
            }
            else {
                chrome.storage.local.get(function (items) {
                    if (has_last_tabs(items)) {
                        var legacy_tabs = items.KEY_YOUR_LAST_TABS;
                        diff = current_tabs.length + legacy_tabs.length - options.MAX_RECORD_COUNT;
                        if (diff <= 0) {
                            current_tabs.push.apply(current_tabs, legacy_tabs);
                        }
                        else if (diff < legacy_tabs.length) {
                            current_tabs.push.apply(current_tabs, legacy_tabs.slice(diff, legacy_tabs.length));
                        }
                    }
                    chrome.storage.sync.set({ KEY_YOUR_LAST_TABS: current_tabs });
                });
            }
        });
    });
}

function is_position_valid(pos) {
    return pos != null && (pos.top > 0 || pos.left > 0);
}

function get_position(url, callback) {
    chrome.storage.sync.get(KEY_POSITIONS, function (items) {
        var positions = items.KEY_POSITIONS;
        if (positions !== null) {
            var pos = positions[url];
            if (is_position_valid(pos)) {
                callback(pos);
            }
        }
    });
}

function set_position(url, pos) {
    chrome.storage.sync.get(function (items) {
        var positions = items.KEY_POSITIONS || {};
        if (is_position_valid(pos)) {
            positions[url] = pos;
        }
        else {
            delete positions[url];
        }
        chrome.storage.sync.set({ KEY_POSITIONS: positions });
    });
}

function remove_positions_not_opened() {
    chrome.storage.sync.get(KEY_POSITIONS, function (items) {
        var positions = items.KEY_POSITIONS;
        if (positions !== null) {
            chrome.tabs.query(NOT_PINED_TABS, function (tabs) {
                var copy = {};
                tabs.forEach(function (tab) {
                    var url = tab.url;
                    var pos = positions[url];
                    if (pos != null && is_url_ok(url)) {
                        copy[url] = pos;
                    }
                });
                chrome.storage.sync.set({ KEY_POSITIONS: copy });
            });
        }
    });
}
