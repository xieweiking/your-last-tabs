(function () {
    var head = document.getElementById('head'),
        arrange_pane = document.getElementById('arrange-pane'),
        list = document.getElementById('list'),
        buttons_pane = document.getElementById('buttons-pane'),
        checked_value = ' checked="checked"',
        arrange_template = [
            '<input id="arrange-checkbox" type="checkbox"',  null/*1*/, ' />',
            '<label id="arrange-label" for="arrange-checkbox">',
                null/*4*/,
            '</label>'
        ],
        li_template = [
            '<li class="item" title="', null/*1*/, '">',
                '<img class="icon" src="chrome://favicon/', null/*4*/, '" />',
                '<a class="link" target="_blank" href="', null/*7*/, '" data-position="', null/*9*/,'">',
                    null/*11*/,
                '</a>',
                '<a class="close-btn" href="javascript:void(0);" title="', null/*14*/, '">×</a>',
            '</li>'
        ],
        buttons_template = [
            '<button class="open-all-btn" type="button">',
                null/*1*/,
            '</button>',
            '<button class="clear-all-btn" type="button">',
                null/*4*/,
            '</button>'
        ],
        http_url_pattern = /^(https?:\/\/[^\/]+\/).*$/,
        sure_to_remove_all_label = chrome.i18n.getMessage('sureToRemoveAllLabel'),
        no_more_tab_header = chrome.i18n.getMessage('noMoreTab'),
        close_btn_tooltip = chrome.i18n.getMessage('closeButtonTooltip'),
        extension_name = chrome.i18n.getMessage('extensionName'),
        arrange_label = chrome.i18n.getMessage('optionArrange'),
        open_all_button_label = chrome.i18n.getMessage('openAllButtonLabel'),
        clear_all_button_label = chrome.i18n.getMessage('clearAllButtonLabel');
    function remove_item(event, clicked) {
        var li = event.target.parentNode;
        chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
            if (has_last_tabs(items)) {
                var last_tabs = items.KEY_YOUR_LAST_TABS,
                    url = li.getElementsByClassName('link')[0].href,
                    i = 0, tab = null, has_next = false;
                for (; i < last_tabs.length; ++i) {
                    tab = last_tabs[i];
                    if (tab.url == url) {
                        has_next = last_tabs.length > 1;
                        if (clicked === true || has_next || confirm(sure_to_remove_all_label)) {
                            if (clicked !== true) {
                                chrome.extension.sendMessage(null, { remove: (has_next ? { index: i, value: tab } : { clear: true }) });
                            }
                            list.removeChild(li);
                            last_tabs.remove(i);
                            chrome.storage.local.set({ KEY_YOUR_LAST_TABS: last_tabs }, save_all_windows_tabs);
                            break;
                        }
                    }
                }
                if (last_tabs.length == 0) {
                    show_no_more_tab();
                }
            }
        });
    }
    function show_no_more_tab() {
        remove_all_event_listeners();
        arrange_pane.innerHTML = EMPTY_STR;
        list.innerHTML = EMPTY_STR;
        buttons_pane.innerHTML = EMPTY_STR;
        head.innerHTML = no_more_tab_header;
        chrome.tabs.getSelected(null, function (tab) {
            setTimeout(function () {
                chrome.pageAction.hide(tab.id);
            }, 300);
        });
    }
    function open_all_links() {
        chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
            if (has_last_tabs(items)) {
                var last_tabs = items.KEY_YOUR_LAST_TABS;
                if (is_arrange_checkbox_checked()) {
                    arrange(last_tabs);
                }
                last_tabs.forEach(function (tab) {
                    var url = tab.url, pos = {};
                    pos[url] = tab.position;
                    chrome.storage.local.set(pos, function () {
                        chrome.tabs.create({ url: url, selected: false });
                    });
                });
                remove_all_items();
                chrome.tabs.getSelected(null, function (tab) {
                    if (is_newtab(tab)) {
                        chrome.tabs.remove(tab.id);
                    }
                });
            }
        });
    }
    function confirm_to_remove_all() {
        if (confirm(sure_to_remove_all_label)) {
            remove_all_items();
        }
    }
    function remove_all_items() {
        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: [] }, function () {
            show_no_more_tab();
            save_all_windows_tabs();
            chrome.extension.sendMessage(null, { clear: true });
        });
    }
    function rebuild_links(last_tabs, arrange) {
        remove_links_event_listeners();
        build_list(last_tabs, arrange);
        add_links_event_listeners();
    }
    function arrange_links(event) {
        chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
            if (has_last_tabs(items)) {
                var last_tabs = items.KEY_YOUR_LAST_TABS;
                get_options(function (options) {
                    options.ARRANGE = event.target.checked;
                    rebuild_links(last_tabs, options.ARRANGE);
                    chrome.storage.sync.set({ OPTIONS: options });
                });
            }
        });
    }
    function dom_class_each(clazz, fn) {
        Array.prototype.forEach.call(document.getElementsByClassName(clazz), fn);
    }
    function dom_class_add_listener(clazz, event_type, fn, capture) {
        dom_class_each(clazz, function (dom) {
            dom.addEventListener(event_type, fn, capture);
        });
    }
    function dom_id_add_listener(id, event_type, fn, capture) {
        var dom = document.getElementById(id);
        if (dom != null) {
            dom.addEventListener(event_type, fn, capture);
        }
    }
    function dom_class_remove_listener(clazz, event_type, fn, capture) {
        dom_class_each(clazz, function (dom) {
            dom.removeEventListener(event_type, fn, capture);
        });
    }
    function dom_id_remove_listener(id, event_type, fn, capture) {
        var dom = document.getElementById(id);
        if (dom != null) {
            dom.removeEventListener(event_type, fn, capture);
        }
    }
    function click_link(event) {
        event.preventDefault();
        var a = event.target, url = a.href, pos = {};
        pos[url] = JSON.parse(a.getAttribute('data-position'));
        chrome.storage.local.set(pos, function () {
            get_options(function (options) {
                if (event.button === 0 && !options.IN_BLANK) {
                    chrome.tabs.getSelected(null, function (tab) {
                        if (is_newtab(tab)) {
                            chrome.tabs.update(tab.id, { url: url });
                        }
                        else {
                            chrome.tabs.create({ url: url, selected: true });
                        }
                    });
                }
                else if (event.button === 1 || options.IN_BLANK) {
                    chrome.tabs.create({ url: url, selected: false });
                }
                remove_item(event, true);
            });
        });
    }
    function arrange(last_tabs) {
        if (last_tabs == null || last_tabs.length < 3) {
            return;
        }
        var host_list = [], idx = 0;
        last_tabs.forEach(function (tab) {
            var host = http_url_pattern.exec(tab.url)[1],
                not_found = true;
            host_list.forEach(function (item) {
                if (item.host == host) {
                    item.tabs.push(tab);
                    not_found = false;
                }
            });
            if (not_found) {
                host_list.push({ host: host, tabs: [tab] });
            }
        });
        host_list.forEach(function (item) {
            item.tabs.forEach(function (tab) {
                last_tabs[idx] = tab;
                ++idx;
            });
        });
    }
    function build_list(last_tabs, do_arrange) {
        if (do_arrange) {
            arrange(last_tabs);
        }
        var builder = [];
        last_tabs.forEach(function (tab) {
            var url = tab.url, title = tab.title, pos = tab.position;
            li_template[1] = title;
            li_template[4] = url;
            li_template[7] = url;
            li_template[9] = is_position_valid(pos) ? JSON.stringify(pos).replace(/"/g, '&quot;') : 'null';
            li_template[11] = title;
            li_template[14] = close_btn_tooltip;
            builder.push(li_template.join(EMPTY_STR));
        });
        list.innerHTML = builder.join(EMPTY_STR);
    }
    function add_links_event_listeners() {
        dom_class_add_listener('close-btn', 'click', remove_item);
        dom_class_add_listener('link', 'click', click_link);
    }
    function add_all_event_listeners() {
        add_links_event_listeners();
        dom_class_add_listener('open-all-btn', 'click', open_all_links);
        dom_class_add_listener('clear-all-btn', 'click', confirm_to_remove_all);
        dom_id_add_listener('arrange-checkbox', 'click', arrange_links);
    }
    function remove_links_event_listeners() {
        dom_class_remove_listener('close-btn', 'click', remove_item);
        dom_class_remove_listener('link', 'click', click_link);
    }
    function remove_all_event_listeners() {
        remove_links_event_listeners();
        dom_class_remove_listener('open-all-btn', 'click', open_all_links);
        dom_class_remove_listener('clear-all-btn', 'click', confirm_to_remove_all);
        dom_id_remove_listener('arrange-checkbox', 'click', arrange_links);
    }
    chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
        if (has_last_tabs(items)) {
            var last_tabs = items.KEY_YOUR_LAST_TABS;
            get_options(function (options) {
                var do_arrange = options.ARRANGE;
                head.innerHTML = extension_name;
                arrange_template[1] = do_arrange ? checked_value : EMPTY_STR;
                arrange_template[4] = arrange_label;
                arrange_pane.innerHTML = arrange_template.join(EMPTY_STR);
                buttons_template[1] = open_all_button_label;
                buttons_template[4] = clear_all_button_label;
                buttons_pane.innerHTML = buttons_template.join(EMPTY_STR);
                build_list(last_tabs, do_arrange);
                add_all_event_listeners();
            });
        }
        else {
            show_no_more_tab();
        }
    });
    function is_arrange_checkbox_checked() {
        return document.getElementById('arrange-checkbox').checked;
    }
    window.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.keyCode == 90) {
            chrome.extension.sendMessage(null, { undo: true }, function (response) {
                if (response != null) {
                    chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
                        if (has_last_tabs(items)) {
                            var last_tabs = items.KEY_YOUR_LAST_TABS;
                            last_tabs.splice(response.index, 0, response.value);
                            rebuild_links(last_tabs, is_arrange_checkbox_checked());
                            chrome.storage.local.set({ KEY_YOUR_LAST_TABS: last_tabs }, save_all_windows_tabs);
                        }
                    });
                }
            });
        }
    });
})();
