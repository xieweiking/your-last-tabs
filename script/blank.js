(function () {
    get_options(function (options) {
        if (options.STANDING) {
            window.onbeforeunload = function () {
                chrome.extension.sendMessage(null, { standing: true }/*, function (response) { }*/);
            };
        }
    });
})();
