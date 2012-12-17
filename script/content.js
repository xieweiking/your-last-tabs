(function () {
    if (STANDING) {
        var scanner_id = null;
        scanner_id = setInterval(function () {
            if (document.body !== null && scanner_id !== null) {
                var stub = document.createElement('iframe');
                stub.name = 'your_last_tabs_background_notifier';
                stub.style.visibility = 'hidden';
                stub.style.width = '0px';
                stub.style.height = '0px';
                stub.style.border = 'none';
                stub.src = chrome.extension.getURL('page/blank.html');
                document.body.appendChild(stub);
                clearInterval(scanner_id);
            }
        }, 100);
    }
})();
