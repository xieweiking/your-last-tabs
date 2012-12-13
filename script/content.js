(function () {
    var old_unload = null;
    var notified = false;
    var scanner_id = null;
    function notify_background() {
        if (!notified) {
            chrome.extension.sendRequest({ create_newtab: true });
            notified = true;
            var i = 0;
            while (i < 4000000) {
                ++i;
            }
            if (scanner_id != null) {
                clearInterval(scanner_id);
            }
        }
        if (old_unload != null) {
            var temp = old_unload;
            old_unload = null;
            return temp();
        }
    }
    scanner_id = setInterval(function () {
        if (notified) {
            return;
        }
        var current = window.onbeforeunload;
        if (current != null && current != notify_background) {
            old_unload = current;
        }
        if (current != notify_background) {
            window.onbeforeunload = notify_background;
        }
    }, 100);
})();
