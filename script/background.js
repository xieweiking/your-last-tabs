(function() {
    var POPULATE_TABS = { populate: true };
    var NEWTAB_URL = 'chrome://newtab/';
    chrome.storage.sync.get(function(items) {
        if (items != null && items.KEY_YOUR_LAST_TABS != null) {
            chrome.storage.local.set({ KEY_YOUR_LAST_TABS: items.KEY_YOUR_LAST_TABS });
        }
    });
    function show_on_newtab(tab) {
        chrome.storage.local.get(function(items) {
            if (items != null && items.KEY_YOUR_LAST_TABS != null) {
                var tab_id = tab.id;
                if (tab.url == NEWTAB_URL && items.KEY_YOUR_LAST_TABS.length > 0) {
                    chrome.pageAction.show(tab_id);
                }
                else {
                    chrome.pageAction.hide(tab_id);
                }
            }
        });
    }
    function get_current_tabs(windows) {
        var current_tabs = [];
        for (var i = 0; i < windows.length; ++i) {
            var tabs = windows[i].tabs;
            for (var j = 0; j < tabs.length; ++j) {
                var tab = tabs[j];
                var url = tab.url;
                if (url != null && url != '' && !/^chrome\:\/\/.+/.test(url)) {
                    current_tabs.push({ url: url, title: tab.title });
                }
            }
        }
        return current_tabs;
    }
    function store_current_tabs() {
        chrome.windows.getAll(POPULATE_TABS, function(windows) {
            chrome.storage.sync.set({ KEY_YOUR_LAST_TABS: get_current_tabs(windows) });
        });
    }
    chrome.tabs.onUpdated.addListener(function(id, info, tab) {
        show_on_newtab(tab);
        store_current_tabs();
    });
    chrome.tabs.onActivated.addListener(function(active_info) {
        chrome.tabs.get(active_info.tabId, function(tab) {
            show_on_newtab(tab);
        });
    });
    chrome.tabs.onRemoved.addListener(function(tab_id, remove_info) {
        chrome.windows.getAll(null, function(windows) {
            if (windows.length > 0 || !remove_info.isClosingWindow) {
                store_current_tabs();
            }
        });
    });
    var scaner_id = null;
    scaner_id = setInterval(function() {
        chrome.windows.getAll(POPULATE_TABS, function(windows) {
            chrome.storage.local.get(function(items) {
                if (items != null && items.KEY_YOUR_LAST_TABS != null) {
                    var current_tabs = get_current_tabs(windows);
                    var LAST_TABS = items.KEY_YOUR_LAST_TABS;
                    if (LAST_TABS.length > 0) {
                        for (var i = 0; i < current_tabs.length; ++i) {
                            for (var j = 0; j < LAST_TABS.length; ++j) {
                                if (current_tabs[i].url == LAST_TABS[j].url) {
                                    LAST_TABS.remove(j);
                                    --j;
                                }
                            }
                        }
                        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: LAST_TABS });
                    }
                    else {
                        clearInterval(scaner_id);
                    }
                }
            });
        });
    }, 4200);
    setTimeout(function() { // FIXME this is a hack of loading the page_action immediately.
        chrome.tabs.getSelected(null, function(tab) {
            chrome.storage.local.get(function(items) {
                if (items != null && items.KEY_YOUR_LAST_TABS != null
                    && items.KEY_YOUR_LAST_TABS.length > 0 && tab.url == NEWTAB_URL) {
                        chrome.tabs.reload(tab.id);
                }
            });
        });
    }, 300);
})();
