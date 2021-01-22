/** @module options */

'use strict';

const g_spellSelectorsTextarea = document.querySelector('#spell-selectors'),
    g_spellHighlightInput = document.querySelector('#spell-highlight'),
    g_resetToDefaultsButton = document.querySelector('#reset-to-defaults'),
    g_sidebarTextareaRows = document.querySelector('#sidebar-textarea-rows'),
    g_sidebarTextareaCols = document.querySelector('#sidebar-textarea-cols'),
    g_dictionary = document.querySelector('#dictionary'),
    g_enabled = document.querySelector('#enabled'),
    g_disabled = document.querySelector('#disabled'),
    g_whitelist = document.querySelector('#whitelist'),
    g_blacklist = document.querySelector('#blacklist'),
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

    g_dictionary.value = Object.keys(options['dictionary']).sort().join('\n');

    g_whitelist.value = options.onOff.whitelist.join('\n');
    g_blacklist.value = options.onOff.blacklist.join('\n');
    if (options.onOff.enabled)
        g_enabled.checked = true;
    else
        g_disabled.checked = true;
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

    const words = {};
    g_dictionary.value.split('\n').forEach(w => {
        if (w)
            words[w] = true;
    });
    options['dictionary'] = words;

    options.onOff = {
        enabled: g_enabled.checked,
        whitelist: g_whitelist.value.split('\n'),
        blacklist: g_blacklist.value.split('\n'),
    };

    chrome.storage.local.set(options);
};

chrome.storage.local.get(null, loadOptions);
document.addEventListener('blur', saveOptions);
g_resetToDefaultsButton.addEventListener('click',
    () => chrome.storage.local.get([ 'defaults' ],
        (options) => loadOptions(options.defaults)));
