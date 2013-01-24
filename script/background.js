(function () {
    function show_page_action(tab) {
        var tab_id = tab.id;
        get_options(function (options) {
            if (OPTIONS_URL != tab.url && (options.ALWAYS_APPEAR || is_newtab(tab))) {
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
    var undo_stack = [], scaner_id = null, show_intrvl = null, ALL_TABS = {};
    get_options(function (options) {
        if (options.STANDING) {
            chrome.extension.onMessage.addListener(function (request, sender) {
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
                        }
                    });
                }
            });
        }
    });
    chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.save) {
            save_all_windows_tabs();
        }
        else if (request.remove != null) {
            undo_stack.push(request.remove);
        }
        else if (request.undo && typeof(sendResponse) == 'function' && undo_stack.length > 0) {
            sendResponse(undo_stack.pop());
        }
        else if (request.clear) {
            while (undo_stack.length > 0) {
                undo_stack.pop();
            }
        }
    });
    scaner_id = setInterval(function () {
        chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
            if (has_last_tabs(items)) {
                chrome.tabs.query(ALL_TABS, function (tabs) {
                    var last_tabs = items.KEY_YOUR_LAST_TABS, remove_count = 0;
                    tabs.forEach(function (tab) {
                        for (var i = 0; i < last_tabs.length; ++i) {
                            if (tab.url == last_tabs[i].url) {
                                last_tabs.remove(i);
                                ++remove_count;
                                --i;
                            }
                        }
                    });
                    if (remove_count > 0) {
                        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: last_tabs }, save_all_windows_tabs);
                    }
                });
            }
            else if (scaner_id !== null) {
                clearInterval(scaner_id);
            }
        });
    }, 1000);
    show_intrvl = setInterval(function () {
        chrome.tabs.getSelected(null, function (tab) {
            show_page_action(tab);
            if (show_intrvl !== null) {
                clearInterval(show_intrvl);
            }
        });
    }, 600);
})();
