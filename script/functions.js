var CHROME_INNER_URL_PATTERN = /^chrome(-.+)?\:\/\/.+/;
var NEWTAB = { url: 'chrome://newtab/', selected : false };
var NOT_PINED_TABS = { pinned: false };
var KEY_YOUR_LAST_TABS = 'KEY_YOUR_LAST_TABS';
var GET_POSITION_INJECTION = { code: '({ top: document.body.scrollTop, left: document.body.scrollLeft })' };
var OPTIONS_URL = chrome.extension.getURL('page/options.html');

function is_newtab(tab) {
    return tab.url == NEWTAB.url;
}

function has_last_tabs(items) {
    return items != null && items.KEY_YOUR_LAST_TABS != null && items.KEY_YOUR_LAST_TABS.length > 0;
}

function is_url_ok(url) {
    return url != null && url != '' && !CHROME_INNER_URL_PATTERN.test(url);
}
function is_position_valid(pos) {
    var typeNum = typeof(0);
    return pos != null && typeof(pos.top) == typeNum && typeof(pos.left) == typeNum;
}

function is_positions_ready(positions, current_tabs) {
    for (var i = 0; i < current_tabs.length; ++i) {
        var tab = current_tabs[i];
        if (positions[tab.url] == null) {
            return false;
        }
    }
    return true;
}

function save_all_windows_tabs() {
    chrome.tabs.query(NOT_PINED_TABS, function (tabs) {
        var current_tabs = [];
        var url_map = {};
        var positions = {};
        tabs.forEach(function (tab) {
            var url = tab.url;
            if (!url_map[url] && is_url_ok(url)) {
                var title = tab.title;
                current_tabs.push({ url: url, title: (title == null || title == '' ? url : title) });
                url_map[url] = true;
                chrome.tabs.executeScript(tab.id, GET_POSITION_INJECTION, function (ary) {
                    if (ary != null && ary.length > 0) {
                        positions[url] = ary[0];
                    }
                });
            }
        });
        var check_id = null;
        check_id = setInterval(function () {
            if (check_id !== null && is_positions_ready(positions, current_tabs)) {
                clearInterval(check_id);
                current_tabs.forEach(function (tab) {
                    tab.position = positions[tab.url];
                });
                get_options(function (options) {
                    var diff = current_tabs.length - options.MAX_RECORD_COUNT;
                    if (diff >= 0) {
                        if (diff > 0) {
                            current_tabs = current_tabs.slice(diff, current_tabs.length);
                        }
                        chrome.storage.sync.set({ KEY_YOUR_LAST_TABS: current_tabs });
                    }
                    else {
                        chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
                            if (has_last_tabs(items)) {
                                var legacy_tabs = items.KEY_YOUR_LAST_TABS;
                                diff += legacy_tabs.length;
                                if (diff < legacy_tabs.length) {
                                    if (diff > 0) {
                                        legacy_tabs = legacy_tabs.slice(diff, legacy_tabs.length);
                                    }
                                    current_tabs.push.apply(current_tabs, legacy_tabs);
                                }
                            }
                            chrome.storage.sync.set({ KEY_YOUR_LAST_TABS: current_tabs });
                        });
                    }
                });
            }
        }, 400);
    });
}
