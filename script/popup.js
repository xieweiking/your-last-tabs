(function () {
    var head = document.getElementById('head');
    var list = document.getElementById('list');
    var clear_all = document.getElementById('clear-all');
    var li_template = [
        '<li class="item" title="', null/*1*/, '">',
            '<img class="icon" src="chrome://favicon/', null/*4*/, '" />',
            '<a class="link" target="_blank" href="', null/*7*/, '" data-position="', null/*9*/,'">',
                null/*11*/,
            '</a>',
            '<a class="close-btn" href="javascript:void(0);" title="', null/*14*/, '">×</a>',
        '</li>'
    ];
    var buttons_template = [
        '<button class="open-all-btn" type="button">',
            null/*1*/,
        '</button>',
        '<button class="clear-all-btn" type="button">',
            null/*4*/,
        '</button>'
    ];
    function remove_item(event) {
        var li = event.target.parentNode;
        chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
            if (has_last_tabs(items)) {
                var LAST_TABS = items.KEY_YOUR_LAST_TABS;
                var url = li.getElementsByClassName('link')[0].href;
                list.removeChild(li);
                for (var i = 0; i < LAST_TABS.length; ++i) {
                    if (LAST_TABS[i].url == url) {
                        LAST_TABS.remove(i);
                        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: LAST_TABS });
                        break;
                    }
                }
                if (LAST_TABS.length == 0) {
                    show_no_more_tab();
                }
            }
            save_all_windows_tabs();
        });
    }
    function show_no_more_tab() {
        list.innerHTML = '';
        clear_all.innerHTML = '';
        head.innerHTML = chrome.i18n.getMessage('noMoreTab');
        chrome.tabs.getSelected(null, function (tab) {
            setTimeout(function () {
                chrome.pageAction.hide(tab.id);
            }, 300);
        });
    }
    function open_all_links() {
        chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
            if (has_last_tabs(items)) {
                var LAST_TABS = items.KEY_YOUR_LAST_TABS;
                LAST_TABS.forEach(function (link) {
                    var url = link.url;
                    var pos = {};
                    pos[url] = link.position;
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
    function remove_all_items() {
        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: [] }, function () {
            show_no_more_tab();
            save_all_windows_tabs();
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
    function click_link(event) {
        event.preventDefault();
        var a = event.target;
        var url = a.href;
        var pos = {};
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
                remove_item(event);
            });
        });
    }
    chrome.storage.local.get(KEY_YOUR_LAST_TABS, function (items) {
        if (has_last_tabs(items)) {
            var LAST_TABS = items.KEY_YOUR_LAST_TABS;
            head.innerHTML = chrome.i18n.getMessage('extensionName');
            var close_btn_tooltip = chrome.i18n.getMessage('closeButtonTooltip');
            var builder = [];
            LAST_TABS.forEach(function (link) {
                var url = link.url;
                var title = link.title;
                var pos = link.position;
                li_template[1] = title;
                li_template[4] = url;
                li_template[7] = url;
                li_template[9] = is_position_valid(pos) ? JSON.stringify(pos).replace(/"/g, '&quot;') : 'null';
                li_template[11] = title;
                li_template[14] = close_btn_tooltip;
                builder.push(li_template.join(''));
            });
            list.innerHTML = builder.join('');
            buttons_template[1] = chrome.i18n.getMessage('openAllButtonLabel');
            buttons_template[4] = chrome.i18n.getMessage('clearAllButtonLabel');
            clear_all.innerHTML = buttons_template.join('');
            dom_class_add_listener('close-btn', 'click', remove_item);
            dom_class_add_listener('link', 'click', click_link);
            dom_class_add_listener('open-all-btn', 'click', open_all_links);
            dom_class_add_listener('clear-all-btn', 'click', remove_all_items);
        }
        else {
            show_no_more_tab();
        }
    });
})();
