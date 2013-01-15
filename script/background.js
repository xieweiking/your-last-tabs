(function () {
    function show_page_action(tab) {
        var tab_id = tab.id;
        get_options(function (options) {
            var url = tab.url;
            if (OPTIONS_URL != url && (options.ALWAYS_APPEAR || CHROME_INNER_URL_PATTERN.test(url))) {
                chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
                    if (has_last_tabs(items)) {
                        chrome.pageAction.show(tab_id);
                    }
                    else {
                        chrome.pageAction.hide(tab_id);
                    }
                });
            }
            else {
                chrome.pageAction.hide(tab_id);
            }
        });
    }
    chrome.storage.sync.get(function (items) {
        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: (has_last_tabs(items) ? items.KEY_YOUR_LAST_TABS : []) });
    });
    chrome.tabs.onUpdated.addListener(function (tab_id, change_info, tab) {
        show_page_action(tab);
        save_all_windows_tabs();
    });
    chrome.tabs.onRemoved.addListener(function (tab_id, remove_info) {
        save_all_windows_tabs();
    });
    chrome.tabs.onActivated.addListener(function (active_info) {
        chrome.tabs.get(active_info.tabId, show_page_action);
    });
    get_options(function (options) {
        if (options.STANDING) {
            chrome.extension.onMessage.addListener(function (request, sender) {
                var ALL_TABS = {};
                if (request.standing) {
                    chrome.tabs.query(ALL_TABS, function (tabs) {
                        if (tabs.length == 1 && !CHROME_INNER_URL_PATTERN.test(tabs[0].url)) {
                            chrome.tabs.create(NEWTAB, function (t) {
                                chrome.tabs.query(ALL_TABS, function (ts) {
                                    if (ts.length > 1) {
                                        chrome.tabs.remove(t.id);
                                    }
                                });
                            });
                            for (var i = 0; i < 40000; ++i); // HACK: hold chrome as long as possible
                        }
                    });
                }
            });
        }
    });
    chrome.extension.onMessage.addListener(function (request, sender) {
        if (request.save) {
            save_all_windows_tabs();
        }
    });
    var scaner_id = null;
    scaner_id = setInterval(function () {
        chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
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
            else if (scaner_id !== null) {
                clearInterval(scaner_id);
            }
        });
    }, 1000);
    var show_intrvl = null;
    show_intrvl = setInterval(function () {
        chrome.tabs.getSelected(null, function (tab) {
            show_page_action(tab);
            if (show_intrvl !== null) {
                clearInterval(show_intrvl);
            }
        });
    }, 600);
})();
