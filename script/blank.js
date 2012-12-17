(function () {
    if (STANDING) {
        window.onbeforeunload = function () {
            chrome.extension.sendRequest({ standing: true });
        };
    }
})();
