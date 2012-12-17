var CHROME_INNER_URL_PATTERN = /^chrome\:\/\/.+/;
var NEWTAB = { url: 'chrome://newtab/', selected : false };
var NOT_PINED_TABS = { pinned: false };

function is_newtab(tab) {
    return tab.url == NEWTAB.url;
}

function has_last_tabs(items) {
    return items != null && items.KEY_YOUR_LAST_TABS != null && items.KEY_YOUR_LAST_TABS.length > 0;
}

function save_all_windows_tabs() {
    chrome.tabs.query(NOT_PINED_TABS, function (tabs) {
        var current_tabs = [];
        var url_map = {};
        tabs.forEach(function (tab) {
            var url = tab.url;
            if (url != null && url != '' && !CHROME_INNER_URL_PATTERN.test(url) && !url_map[url]) {
                var title = tab.title;
                current_tabs.push({ url: url, title: (title == null || title == '' ? url : title) });
                url_map[url] = true;
            }
        });
        var diff = current_tabs.length - MAX_RECORD_COUNT;
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
                    diff = current_tabs.length + legacy_tabs.length - MAX_RECORD_COUNT;
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
}
