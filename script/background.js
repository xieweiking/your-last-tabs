(function () {
    function show_page_action(tab) {
        var tab_id = tab.id;
        get_options(function (options) {
            if (OPTIONS_URL != tab.url && (options.ALWAYS_APPEAR || is_newtab(tab))) {
                chrome.storage.local.get(KEY_YOUR_LAST_TABS_TMP, function (items) {
                    if (has_last_tabs_tmp(items)) {
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
    chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
        chrome.storage.local.set({ KEY_YOUR_LAST_TABS_TMP:
            (items != null && items.KEY_YOUR_LAST_TABS != null ? items.KEY_YOUR_LAST_TABS : []) });
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
    var undo_stack = [], scaner_id = null, show_intrvl = null, ALL_TABS = {}, creating_newtab = false;
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
        chrome.storage.local.get(KEY_YOUR_LAST_TABS_TMP, function (items) {
            if (has_last_tabs_tmp(items)) {
                chrome.tabs.query(ALL_TABS, function (tabs) {
                    var last_tabs = items.KEY_YOUR_LAST_TABS_TMP, remove_count = 0;
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
                        chrome.storage.local.set({ KEY_YOUR_LAST_TABS_TMP: last_tabs }, save_all_windows_tabs);
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
    function save_and_close_tab(t_id, record) {
        chrome.storage.local.get(KEY_YOUR_LAST_TABS_TMP, function (items) {
            if (items != null && items.KEY_YOUR_LAST_TABS_TMP != null) {
                var legacy_tabs = items.KEY_YOUR_LAST_TABS_TMP;
                legacy_tabs.splice(0, 0, record);
                chrome.storage.local.set({ KEY_YOUR_LAST_TABS_TMP: legacy_tabs }, function () {
                    chrome.tabs.remove(t_id);
                });
            }
        });
    }
    chrome.contextMenus.create({ title: chrome.i18n.getMessage('contextMenu'), onclick: function (info, tab) {
        var t_id = tab.id, url = tab.url, record = null;
        if (is_url_ok(url)) {
            record = { url: url, title: get_tab_title(url, tab.title), position: DEFAULT_POSITION };
            if (is_tab_can_not_be_injected(tab)) {
                save_and_close_tab(t_id, record);
            }
            else {
                chrome.tabs.executeScript(t_id, GET_POSITION_INJECTION, function (ary) {
                    record.position = extract_position(ary);
                    save_and_close_tab(t_id, record);
                });
            }
        }
    } });
    setInterval(function () {
        get_options(function (options) {
            if (options.STANDING) {
                chrome.tabs.query(NOT_PINED_TABS, function (tabs) {
                    var no_empty_tab = true;
                    for (var i = tabs.length - 1; i >= 0; --i) {
                        if (is_newtab(tabs[i])) {
                            no_empty_tab = false;
                            break;
                        }
                    }
                    if (no_empty_tab && !creating_newtab) {
                        creating_newtab = true;
                        chrome.tabs.create(NEWTAB, function () {
                            creating_newtab = false;
                        });
                    }
                });
            }
        });
    }, 1000);
})();
