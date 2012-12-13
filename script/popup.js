(function () {
    var head = document.getElementById('head');
    var list = document.getElementById('list');
    var clear_all = document.getElementById('clear-all');
    var li_template = [
        '<li class="item" title="', null/*1*/, '">',
            '<img class="icon" src="chrome://favicon/', null/*4*/, '" />',
            '<a class="link" target="_blank" href="', null/*7*/, '" >',
                null/*9*/,
            '</a>',
            '<a class="close-btn" href="javascript:void(0);" title="', null/*12*/, '">×</a>',
        '</li>'
    ];
    var clear_all_button_template = [
        '<button class="clear-all-btn" type="button">',
            null/*1*/,
        '</button>'
    ];
    function remove_item(event) {
        var li = event.target.parentNode;
        chrome.storage.local.get(function (items) {
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
    function remove_all_items() {
        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: [] }, function () {
            show_no_more_tab();
            save_all_windows_tabs();
        });
    }
    chrome.storage.local.get(function (items) {
        if (has_last_tabs(items)) {
            var LAST_TABS = items.KEY_YOUR_LAST_TABS;
            head.innerHTML = chrome.i18n.getMessage('extensionName');
            var close_btn_tooltip = chrome.i18n.getMessage('closeButtonTooltip');
            var builder = [];
            LAST_TABS.forEach(function (link) {
                var url = link.url;
                var title = link.title;
                li_template[1] = title;
                li_template[4] = url;
                li_template[7] = url;
                li_template[9] = title;
                li_template[12] = close_btn_tooltip;
                builder.push(li_template.join(''));
            });
            list.innerHTML = builder.join('');
            clear_all_button_template[1] = chrome.i18n.getMessage('clearAllButtonLabel');
            clear_all.innerHTML = clear_all_button_template.join('');

            var close_buttons = document.getElementsByClassName('close-btn');
            for (var i = 0; i < close_buttons.length; ++i) {
                close_buttons[i].addEventListener('click', remove_item);
            }
            var links = document.getElementsByClassName('link');
            for (var i = 0; i < links.length; ++i) {
                links[i].addEventListener('click', function (event) {
                    if (event.button === 0 && !IN_BLANK) {
                        event.preventDefault();
                        chrome.tabs.getSelected(null, function (tab) {
                            chrome.tabs.update(tab.id, { url: event.target.href });
                        });
                    }
                    remove_item(event);
                });
            }
            document.getElementsByClassName('clear-all-btn')[0]
                    .addEventListener('click', remove_all_items);
        }
        else {
            show_no_more_tab();
        }
    });
})();
