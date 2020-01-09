/** @module options */

'use strict';

const g_spellSelectorsTextarea = document.querySelector('#spell-selectors'),
    g_spellHighlightInput = document.querySelector('#spell-highlight'),
    g_resetToDefaultsButton = document.querySelector('#reset-to-defaults'),
    g_sidebarTextareaRows = document.querySelector('#sidebar-textarea-rows'),
    g_sidebarTextareaCols = document.querySelector('#sidebar-textarea-cols'),
    g_spellHighlightClasses = {};

/**
 * @function loadOptions
 * @param options {Object}
 */
const loadOptions = (options) => {
    g_spellSelectorsTextarea.value = options.spellSelectors.replace(/,/g, '\n');
    g_spellHighlightInput.value = options.spellHighlight.code;

    g_spellHighlightClasses.spellHighlight = options.spellHighlight.class;

    g_sidebarTextareaRows.value = options['sidebar_textarea_rows'];
    g_sidebarTextareaCols.value = options['sidebar_textarea_cols'];
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
        sidebar_textarea_rows: parseInt(g_sidebarTextareaRows.value),
        sidebar_textarea_cols: parseInt(g_sidebarTextareaCols.value),
    };

    chrome.storage.sync.set(options);
};

chrome.storage.sync.get(null, loadOptions);
document.addEventListener('blur', saveOptions);
g_resetToDefaultsButton.addEventListener('click',
    () => chrome.storage.sync.get([ 'defaults' ],
        (options) => loadOptions(options.defaults)));
