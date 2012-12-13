(function () {
    chrome.storage.sync.get(function (items) {
        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: (has_last_tabs(items) ? items.KEY_YOUR_LAST_TABS : []) });
    });
    chrome.tabs.onUpdated.addListener(function (id, info, tab) {
        var tab_id = tab.id;
        if (is_newtab(tab)) {
            chrome.storage.local.get(function (items) {
                if (has_last_tabs(items)) {
                    chrome.pageAction.show(tab_id);
                }
            });
        }
        else {
            chrome.pageAction.hide(tab_id);
        }
        save_all_windows_tabs();
    });
    chrome.tabs.onRemoved.addListener(function (tab_id, remove_info) {
        save_all_windows_tabs();
    });
    var scaner_id = null;
    scaner_id = setInterval(function () {
        chrome.storage.local.get(function (items) {
            if (has_last_tabs(items)) {
                chrome.tabs.query({}, function (tabs) {
                    var LAST_TABS = items.KEY_YOUR_LAST_TABS;
                    var remove_count = 0;
                    tabs.forEach(function (tab) {
                        for (var i = 0; i < LAST_TABS.length; ++i) {
                            if (tab.url == LAST_TABS[i].url) {
                                LAST_TABS.remove(i);
                                ++remove_count;
                                --i;
                            }
                        }
                    });
                    if (remove_count > 0) {
                        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: LAST_TABS });
                    }
                });
            }
            else if (scaner_id != null) {
                clearInterval(scaner_id);
            }
        });
    }, 1000);
    setTimeout(function () { // this is a hack of loading the page_action immediately.
        chrome.storage.local.get(function (items) {
            if (has_last_tabs(items)) {
                chrome.tabs.getSelected(null, function (tab) {
                    if (is_newtab(tab)) {
                        chrome.tabs.reload(tab.id);
                    }
                });
            }
        });
    }, 800);
    chrome.extension.onRequest.addListener(function (request, sender) {
        if (request.create_newtab && sender.tab.url != NEWTAB_URL) {
            chrome.tabs.query({}, function(tabs) {
                if (tabs.length <= 1) {
                    chrome.tabs.create(NEWTAB, function(t) {
                        setTimeout(function () {
                            chrome.tabs.query({}, function (ts) {
                                if (ts.length > 1) {
                                    chrome.tabs.remove(t.id);
                                }
                            });
                        }, 50);
                    });
                }
            });
        }
    });
})();
