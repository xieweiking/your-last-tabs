(function () {
    if (STANDING) {
        window.onbeforeunload = function () {
            chrome.extension.sendMessage(null, { standing: true }/*, function (response) { }*/);
        };
    }
})();
