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

function tabs_contain_url(tabs, url) {
    for (var i = 0; i < tabs.length; ++i) {
        if (tabs[i].url === url) {
            return true;
        }
    }
    return false;
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
            var legacy_tabs = [];
            if (diff >= 0) {
                if (diff > 0) {
                    current_tabs = current_tabs.slice(diff, current_tabs.length);
                }
                chrome.storage.sync.set({ KEY_YOUR_LAST_TABS: current_tabs });
                remove_useless_positions(url_map, legacy_tabs);
            }
            else {
                chrome.storage.local.get(function (items) {
                    if (has_last_tabs(items)) {
                        legacy_tabs = items.KEY_YOUR_LAST_TABS;
                        diff = current_tabs.length + legacy_tabs.length - options.MAX_RECORD_COUNT;
                        if (diff < legacy_tabs.length) {
                            if (diff > 0) {
                                legacy_tabs = legacy_tabs.slice(diff, legacy_tabs.length);
                            }
                            current_tabs.push.apply(current_tabs, legacy_tabs);
                        }
                    }
                    chrome.storage.sync.set({ KEY_YOUR_LAST_TABS: current_tabs });
                    remove_useless_positions(url_map, legacy_tabs);
                });
            }
        });
    });
}

function remove_useless_positions(url_map, legacy_tabs) {
    chrome.storage.local.get(KEY_POSITIONS, function (items) {
        var positions = items.KEY_POSITIONS;
        if (positions !== null) {
            var remove_count = 0;
            for (var url in positions) {
                if (positions[url] != null && !url_map[url] && !tabs_contain_url(legacy_tabs, url)) {
                    delete positions[url];
                    ++remove_count;
                }
            }
            if (remove_count > 0) {
                chrome.storage.local.set({ KEY_POSITIONS: positions });
            }
            chrome.storage.sync.set({ KEY_POSITIONS: positions });
        }
    });
}

function is_position_valid(pos) {
    return pos != null && (pos.top > 0 || pos.left > 0);
}

function get_position(url, callback) {
    chrome.storage.local.get(KEY_POSITIONS, function (items) {
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
    chrome.storage.local.get(KEY_POSITIONS, function (items) {
        var positions = items.KEY_POSITIONS || {};
        if (is_position_valid(pos)) {
            positions[url] = pos;
        }
        else {
            delete positions[url];
        }
        chrome.storage.local.set({ KEY_POSITIONS: positions });
    });
}
