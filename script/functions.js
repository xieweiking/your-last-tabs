var CHROME_INNER_URL_PATTERN = /^chrome(-.+)?\:\/\/.+/,
    LOCAL_FILE_URL_PATTERN = /^file\:\/\/.+/,
    NEWTAB = { url: 'chrome://newtab/', selected : false },
    NOT_PINED_TABS = { pinned: false, windowType: 'normal' },
    KEY_YOUR_LAST_TABS = 'KEY_YOUR_LAST_TABS',
    KEY_YOUR_LAST_TABS_TMP = 'KEY_YOUR_LAST_TABS_TMP',
    GET_POSITION_INJECTION = { code: '({ top: document.body.scrollTop, left: document.body.scrollLeft })' },
    DEFAULT_POSITION = { top: 0, left: 0 },
    OPTIONS_URL = chrome.extension.getURL('page/options.html'),
    EMPTY_STR = '';

function is_newtab(tab) {
    return tab.url == NEWTAB.url;
}

function has_last_tabs_tmp(items) {
    return items != null && items.KEY_YOUR_LAST_TABS_TMP != null && items.KEY_YOUR_LAST_TABS_TMP.length > 0;
}

function is_url_ok(url) {
    return url != null && url != EMPTY_STR && !CHROME_INNER_URL_PATTERN.test(url) && !LOCAL_FILE_URL_PATTERN.test(url);
}

function is_position_valid(pos) {
    var typeNum = typeof(0);
    return pos != null && typeof(pos.top) == typeNum && typeof(pos.left) == typeNum;
}

function is_positions_ready(positions, current_tabs) {
    var i = 0, tab = null;
    for (; i < current_tabs.length; ++i) {
        tab = current_tabs[i];
        if (positions[tab.url] == null) {
            return false;
        }
    }
    return true;
}

function get_tab_title(url, title) {
    return title == null || title == EMPTY_STR ? url : title;
}

function extract_position(ary) {
    return chrome.runtime.lastError != null || ary == null || ary.length == 0 ? DEFAULT_POSITION : ary[0];
}

function save_all_windows_tabs() {
    chrome.tabs.query(NOT_PINED_TABS, function (tabs) {
        var current_tabs = [], url_map = {}, positions = {}, check_id = null;
        tabs.forEach(function (tab) {
            var url = tab.url, title = tab.title;
            if (!url_map[url] && is_url_ok(url)) {
                current_tabs.push({ url: url, title: get_tab_title(url, title) });
                url_map[url] = true;
                chrome.tabs.get(tab.id, function (t) { // to ensure the tab was
                    if (t != null) {                   // not bean removed
                        chrome.tabs.executeScript(t.id, GET_POSITION_INJECTION, function (ary) {
                            positions[url] = extract_position(ary);
                        });
                    }
                });
            }
        });
        check_id = setInterval(function () {
            if (check_id !== null && is_positions_ready(positions, current_tabs)) {
                clearInterval(check_id);
                check_id = null;
                current_tabs.forEach(function (tab) {
                    tab.position = positions[tab.url];
                });
                get_options(function (options) {
                    var diff = current_tabs.length - options.MAX_RECORD_COUNT;
                    if (diff >= 0) {
                        if (diff > 0) {
                            current_tabs = current_tabs.slice(diff, current_tabs.length);
                        }
                        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: current_tabs });
                    }
                    else {
                        chrome.storage.local.get(KEY_YOUR_LAST_TABS_TMP, function (items) {
                            if (has_last_tabs_tmp(items)) {
                                var legacy_tabs = items.KEY_YOUR_LAST_TABS_TMP;
                                diff += legacy_tabs.length;
                                if (diff < legacy_tabs.length) {
                                    if (diff > 0) {
                                        legacy_tabs = legacy_tabs.slice(diff, legacy_tabs.length);
                                    }
                                    current_tabs.push.apply(current_tabs, legacy_tabs);
                                }
                            }
                            chrome.storage.local.set({ KEY_YOUR_LAST_TABS: current_tabs });
                        });
                    }
                });
            }
        }, 400);
    });
}
