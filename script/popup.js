(function() {
    var head = document.getElementById('head');
    var list = document.getElementById('list');
    var clear_all = document.getElementById('clear-all');
    var link_target = '_blank'; // TODO get it from options;
    var li_template = [
        '<li class="item" title="', null/*1*/, '">',
            '<img class="icon" src="chrome://favicon/', null/*4*/, '" />',
            '<a class="link" target="', link_target, '" href="', null/*9*/, '" >',
                null/*11*/,
            '</a>',
            '<a class="close-btn" href="javascript:void(0);" title="', null/*14*/, '">×</a>',
        '</li>'
    ];
    var clear_all_button_template = [
        '<button class="clear-all-btn" type="button">',
            null/*1*/,
        '</button>'
    ];
    function remove_item(event) {
        var li = event.target.parentNode;
        chrome.storage.local.get(function(items) {
            if (items != null && items.KEY_YOUR_LAST_TABS != null) {
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
        });
    }
    function show_no_more_tab() {
        list.innerHTML = '';
        clear_all.innerHTML = '';
        head.innerHTML = chrome.i18n.getMessage('noMoreTab');
        chrome.tabs.getSelected(null, function(tab) {
            setTimeout(function() {
                chrome.pageAction.hide(tab.id);
            }, 800);
        });
    }
    function remove_all_items() {
        chrome.storage.local.set({ KEY_YOUR_LAST_TABS: [] }, show_no_more_tab);
    }
    chrome.storage.local.get(function(items) {
        if (items != null && items.KEY_YOUR_LAST_TABS != null) {
            var LAST_TABS = items.KEY_YOUR_LAST_TABS;
            if (LAST_TABS.length > 0) {
                head.innerHTML = chrome.i18n.getMessage('extensionName');
                var close_btn_tooltip = chrome.i18n.getMessage('closeButtonTooltip');
                var builder = [];
                for (var i = 0; i < LAST_TABS.length; ++i) {
                    var link = LAST_TABS[i];
                    var url = link.url;
                    var title = link.title;
                    li_template[1] = title;
                    li_template[4] = url;
                    li_template[9] = url;
                    li_template[11] = title;
                    li_template[14] = close_btn_tooltip;
                    builder.push(li_template.join(''));
                }
                list.innerHTML = builder.join('');
                clear_all_button_template[1] = chrome.i18n.getMessage('clearAllButtonLabel');
                clear_all.innerHTML = clear_all_button_template.join('');

                var close_buttons = document.getElementsByClassName('close-btn');
                for (var i = 0; i < close_buttons.length; ++i) {
                    close_buttons[i].addEventListener('click', remove_item);
                }
                var links = document.getElementsByClassName('link');
                for (var i = 0; i < links.length; ++i) {
                    links[i].addEventListener('click', remove_item);
                }
                document.getElementsByClassName('clear-all-btn')[0]
                        .addEventListener('click', remove_all_items);
            }
            else {
                show_no_more_tab();
            }
        }
    });
})();
