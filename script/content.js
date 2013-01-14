(function () {
    get_options(function (options) {
        if (options.STANDING) {
            var scanner_id = null;
            scanner_id = setInterval(function () {
                if (document.body !== null && scanner_id !== null) {
                    clearInterval(scanner_id);
                    var stub = document.createElement('iframe');
                    var zero_px = '0px';
                    stub.name = 'your_last_tabs_background_notifier';
                    stub.style.visibility = 'hidden';
                    stub.style.border = 'none';
                    stub.style.position = 'absolute';
                    stub.style.width = zero_px;
                    stub.style.height = zero_px;
                    stub.style.top = zero_px;
                    stub.style.left = zero_px;
                    stub.style.padding = zero_px;
                    stub.style.margin = zero_px;
                    stub.src = chrome.extension.getURL('page/blank.html');
                    document.body.appendChild(stub);
                }
            }, 30);
        }
    });
    var current_url = location.href;
    var b = document.body;
    var settled = false;
    chrome.storage.local.get(current_url, function (items) {
        var pos = items[current_url];
        if (is_position_valid(pos)) {
            b.scrollTop = pos.top;
            b.scrollLeft = pos.left;
            chrome.storage.local.remove(current_url);
        }
        settled = true;
    });
    var count = -1;
    function reset_count() {
        count = 2;
    }
    function count_down() {
        if (count > 0) {
            --count;
        }
    }
    var count_intrvl = null;
    function stop_count() {
        if (count_intrvl !== null) {
            clearInterval(count_intrvl);
            count_intrvl = null;
            count = -1;
        }
    }
    function save_after() {
        if (count_intrvl === null) {
            count_intrvl = setInterval(function () {
                if (settled) {
                    if (count <= 0) {
                        stop_count();
                        chrome.extension.sendMessage(null, { save: true });
                    }
                    else {
                        count_down();
                    }
                }
            }, 500);
        }
    }
    window.addEventListener('scroll', function () {
        if (settled) {
            reset_count();
            save_after();
        }
    });
})();
