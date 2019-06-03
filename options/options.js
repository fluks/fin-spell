/** @module options */

'use strict';

const g_spellSelectorsTextarea = document.querySelector('#spell-selectors'),
    g_spellHighlightInput = document.querySelector('#spell-highlight'),
    g_spellHighlightBackupInput = document.querySelector('#spell-highlight-backup'),
    g_resetToDefaultsButton = document.querySelector('#reset-to-defaults'),
    g_spellHighlightClasses = {};

/**
 * @function loadOptions
 * @param options {Object}
 */
const loadOptions = (options) => {
    g_spellSelectorsTextarea.value = options.spellSelectors.replace(/,/g, '\n');
    g_spellHighlightInput.value = options.spellHighlight.code;
    g_spellHighlightBackupInput.value = options.spellHighlightBackup.code;

    g_spellHighlightClasses.spellHighlight = options.spellHighlight.class;
    g_spellHighlightClasses.spellHighlightBackup = options.spellHighlightBackup.class;
};

/**
 * @function saveOptions
 * @param ev {Event}
 */
const saveOptions = (ev) => {
    const options = {
        spellSelectors: g_spellSelectorsTextarea.value.replace(/\n/g, ','),
        spellHighlight: {
            code: g_spellHighlightInput.value,
            class: g_spellHighlightClasses.spellHighlight,
        },
        spellHighlightBackup: {
            code: g_spellHighlightBackupInput.value,
            class: g_spellHighlightClasses.spellHighlightBackup,
        },
    };

    chrome.storage.sync.set(options);
};

chrome.storage.sync.get(null, loadOptions);
document.addEventListener('blur', saveOptions);
g_resetToDefaultsButton.addEventListener('click',
    () => chrome.storage.sync.get([ 'defaults' ],
        (options) => loadOptions(options.defaults)));
