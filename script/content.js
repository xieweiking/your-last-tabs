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
    window.addEventListener('load', function () {
        get_position(location.href, function (pos) {
            var b = document.body;
            b.scrollTop = pos.top;
            b.scrollLeft = pos.left;
        });
    });
    window.addEventListener('scroll', function () {
        var b = document.body;
        set_position(location.href, { top: b.scrollTop, left: b.scrollLeft });
    });
})();
