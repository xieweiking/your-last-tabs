(function () {
    var current_url = location.href, b = document.body, count = -1, count_intrvl = null;
    chrome.storage.local.get(current_url, function (items) {
        var pos = items[current_url];
        if (is_position_valid(pos)) {
            b.scrollTop = pos.top;
            b.scrollLeft = pos.left;
            chrome.storage.local.remove(current_url);
        }
    });
    function reset_count() {
        count = 2;
    }
    function count_down() {
        if (count > 0) {
            --count;
        }
    }
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
                if (count <= 0) {
                    stop_count();
                    chrome.extension.sendMessage(null, { save: true });
                }
                else {
                    count_down();
                }
            }, 500);
        }
    }
    window.addEventListener('scroll', function () {
        reset_count();
        save_after();
    });
})();
