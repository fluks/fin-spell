/** @module background */

'use strict';

const ROOTMENU_ID = 'rootmenu';

/**
 * @function spell
 * @param voikko {Voikko}
 * @param text {String}
 * @returns {Object}
 */
const spell = (voikko, text) => {
    return voikko.tokens(text).map(t => {
        if (t.type === 'WORD')
            return { token: t.text, correct: voikko.spell(t.text) };
        else
            return { token: t.text, correct: undefined };
    });
};

/**
 * @function suggest
 * @param voikko {Voikko}
 * @param word {String}
 * @returns {String[]}
 */
const suggest = (voikko, word) => {
    return voikko.suggest(word);
};

/**
 * @function createRootmenu
 */
const createRootmenu = () => {
    chrome.contextMenus.create({
        id: ROOTMENU_ID,
        title: 'Fin Spell',
        contexts: [ "editable", ],
        visible: true,
    });
};

/**
 * @function removeMenus
 */
const removeMenus = () => {
    chrome.contextMenus.removeAll();
    chrome.contextMenus.refresh();
    if (chrome.contextMenus.onHidden.hasListener(removeMenus)) {
        chrome.contextMenus.onHidden.removeListener(removeMenus);
    }
};

/**
 * @function handleClick
 * @param info {}
 * @param tab {tabs.Tab}
 * @param word {String}
 * @param sendResponse {Function}
 */
const handleClick = (info, tab, word, sendResponse) => {
    removeMenus();

    sendResponse({ name: 'replace_word', data: { word: word, } });
};

/**
 * @function injectScripts
 * @param tabId {Integer}
 * @throws If tabs.insertCSS or tabs.executeScript fails.
 */
const injectScripts = async (tabId) => {
    await browser.tabs.insertCSS(tabId, {
        allFrames: true,
        file: 'content_scripts/jquery.highlight-within-textarea.css',
    });
    const opts = await browser.storage.sync.get([ 'spellHighlight' ]);
    [
        { code: opts.spellHighlight.code, class: opts.spellHighlight.class },
    ].filter(sp => sp.code)
    .forEach(async (sp) => {
        const code = `.hwt-content mark.${sp.class} { ${sp.code} }`;
        await browser.tabs.insertCSS(tabId, {
            allFrames: true,
            code: code,
        });
    });
    [
        '/content_scripts/jquery_highlight_combined.js',
        '/common/spell.js',
        '/content_scripts/content_script.js',
    ].forEach(async (s) => {
        await browser.tabs.executeScript(tabId, {
            allFrames: true,
            file: s,
        });
    });
};

/**
 * @function listener
 * @param request {Object}
 * @param sender {runtime.MessageSender}
 * @param sendResponse {Function}
 * @param voikko {Voikko}
 * @returns {Bool|undefined}
 */
const listener = (request, sender, sendResponse, voikko) => {
    let response = { data: {} };
    if (request.name === 'spell') {
        response.name = 'spell';
        response.data.tokens = spell(voikko, request.data.text);
    }
    else if (request.name === 'suggest') {
        const words = suggest(voikko, request.data.word);
        if (words.length <= 1) {
            sendResponse({ name: 'replace_word', data: { word: null, } });
            return true;
        }

        createRootmenu();
        words.forEach((w, i) => {
            chrome.contextMenus.create({
                id: i.toString(),
                title: w,
                parentId: ROOTMENU_ID,
                onclick: (info, tab) =>
                    handleClick(info, tab, w, sendResponse),
            });
        });
        chrome.contextMenus.onHidden.addListener(removeMenus);
        chrome.contextMenus.refresh();
        return true;
    }
    else if (request.name === 'inject_scripts') {
        try {
            injectScripts(request.tabId);
            response.injected = true;
            sendResponse(response);
            return true;
        }
        catch (error) {
            response = { error: error };
        }
    }
    else
        response = { error: 'Invalid name' };

    sendResponse(response);
};

/**
 * @function load
 * @param libvoikko {Libvoikko}
 */
const load = (libvoikko) => {
    const voikko = libvoikko.init('fi');
    
    browser.runtime.onMessage.addListener((request, sender, sendResponse) =>
        listener(request, sender, sendResponse, voikko));
};

/**
 * @function setDefaultOptions
 * @param details {Object}
 */
const setDefaultOptions = (details) => {
    let options = {};
    if (details.reason === 'install') {
        const highlightedElements = [
            'input[type=search]',
            'input[type=text]',
            'textarea',
        ];
        options = {
            spellSelectors: highlightedElements.join(','),
            spellHighlight: {
                code: '',
                class: 'user-highlight',
            },
        };
        // XXX Shallow copy.
        options.defaults = Object.assign({}, options);

        // XXX New options here, add to update too.
        options.sidebar_textarea_rows = 30;
        options.sidebar_textarea_cols = 50;
        // End of new options.
    }
    else if (details.reason === 'update') {
        options = {};
        // Add same new options as in the install.
        chrome.storage.sync.get(null, (o) => {
            if (!o.hasOwnProperty('sidebar_textarea_rows'))
                options['sidebar_textarea_rows'] = 30;
            if (!o.hasOwnProperty('sidebar_textarea_cols'))
                options['sidebar_textarea_rows'] = 50;
        });
    }
    chrome.storage.sync.set(options);
};

chrome.runtime.onInstalled.addListener(setDefaultOptions);
chrome.commands.onCommand.addListener(() => {
    browser.sidebarAction.open();
});

Libvoikko({
    onLoad: load,
});
