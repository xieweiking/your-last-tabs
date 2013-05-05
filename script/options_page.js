(function () {
    var max_record_count_field = document.getElementById('max-record-count-field'),
        in_blank_true_radio = document.getElementById('in-blank-true-radio'),
        in_blank_false_radio = document.getElementById('in-blank-false-radio'),
        standing_true_radio = document.getElementById('standing-true-radio'),
        standing_false_radio = document.getElementById('standing-false-radio'),
        always_appear_true_radio = document.getElementById('always-appear-true-radio'),
        always_appear_false_radio = document.getElementById('always-appear-false-radio'),
        optionName = chrome.i18n.getMessage('optionName'),
        optionSave = chrome.i18n.getMessage('optionSave'),
        saveOptionOK = optionSave + optionName + chrome.i18n.getMessage('optionOK'),
        extentionName = chrome.i18n.getMessage('extensionName'),
        yesLabel = chrome.i18n.getMessage('optionYes'),
        noLabel = chrome.i18n.getMessage('optionNo');
    window.addEventListener('load', function () {
        document.title = extentionName + ' - ' + optionName;
        document.getElementById('extension-name').innerHTML = extentionName;
        document.getElementById('max-record-count-label').innerHTML = chrome.i18n.getMessage('optionMaxRecordCountLabel');
        document.getElementById('in-blank-label').innerHTML = chrome.i18n.getMessage('optionInBlankLabel');
        document.getElementById('standing-label').innerHTML = chrome.i18n.getMessage('optionStanding');
        document.getElementById('always-appear-label').innerHTML = chrome.i18n.getMessage('optionAlwaysAppear');
        document.getElementById('save-button').innerHTML = optionSave;
        document.getElementById('in-blank-true-label').innerHTML = yesLabel;
        document.getElementById('standing-true-label').innerHTML = yesLabel;
        document.getElementById('always-appear-true-label').innerHTML = yesLabel;
        document.getElementById('in-blank-false-label').innerHTML = noLabel;
        document.getElementById('standing-false-label').innerHTML = noLabel;
        document.getElementById('always-appear-false-label').innerHTML = noLabel;
        get_options(function (options) {
            max_record_count_field.value = options.MAX_RECORD_COUNT;
            if (options.IN_BLANK === true) {
                in_blank_true_radio.checked = true;
            }
            else {
                in_blank_false_radio.checked = true;
            }
            if (options.STANDING === true) {
                standing_true_radio.checked = true;
            }
            else {
                standing_false_radio.checked = true;
            }
            if (options.ALWAYS_APPEAR === true) {
                always_appear_true_radio.checked = true;
            }
            else {
                always_appear_false_radio.checked = true;
            }
        });
        
    });
    document.getElementById('save-button').addEventListener('click', function () {
        get_options(function (options) {
            chrome.storage.local.set({ OPTIONS: {
                MAX_RECORD_COUNT: parseInt(max_record_count_field.value),
                IN_BLANK: in_blank_true_radio.checked,
                STANDING: standing_true_radio.checked,
                ALWAYS_APPEAR: always_appear_true_radio.checked,
                ARRANGE: options.ARRANGE
            } }, function () {
                alert(saveOptionOK);
            });
        });
    });
})();
