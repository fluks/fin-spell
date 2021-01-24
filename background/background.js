/** @module background */

'use strict';

const ROOTMENU_ID = 'rootmenu',
    _ = browser.i18n.getMessage;
// Words user has added.
let g_dictionary = {},
    g_scripts;

/**
 * @function spell
 * @param voikko {Voikko}
 * @param text {String}
 * @returns {Object}
 */
const spell = (voikko, text) => {
    return voikko.tokens(text).map(t => {
        if (t.type === 'WORD') {
            return {
                token: t.text,
                correct: voikko.spell(t.text) || !!g_dictionary[t.text],
            };
        }
        else {
            return {
                token: t.text,
                correct: undefined,
            };
        }
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
 * @function replaceWordWithSuggestion
 * @param word {String}
 * @param sendResponse {Function}
 */
const replaceWordWithSuggestion = (word, sendResponse) => {
    removeMenus();

    sendResponse({ name: 'replace_word', data: { word: word, } });
};

/**
 * @function addWordToDictionary
 * @param word {String} A word to be added to dictionary.
 * @param sendResponse {Function}
 */
const addWordToDictionary = (word, sendResponse) => {
    removeMenus();

    g_dictionary[word] = true;
    chrome.storage.local.set({ 'dictionary': g_dictionary, });

    sendResponse({ name: 'replace_word', data: { word: word, } });
};

/**
 * @function createAddWordToDictionaryMenuItem
 * @param word {String} Word possible added to dictionary.
 * @param sendResponse {Function}
 */
const createAddWordToDictionaryMenuItem = (word, sendResponse) => {
    chrome.contextMenus.create({
        id: 'add-word-to-dictionary',
        title: _('background_addToDictionary'),
        onclick: () => addWordToDictionary(word, sendResponse),
        parentId: ROOTMENU_ID,
    });
};

/** Inject temporary scripts.
 * @function injectScripts
 * @param tabId {Integer}
 */
const injectScripts = async (tabId) => {
    await browser.tabs.insertCSS(tabId, {
        allFrames: true,
        file: 'content_scripts/jquery.highlight-within-textarea.css',
    });
    const opts = await browser.storage.local.get([ 'spellHighlight' ]);
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
        if (g_dictionary[request.data.word]) {
            sendResponse({ name: 'replace_word', data: { word: null, } });
            return true;
        }
        const words = suggest(voikko, request.data.word);
        const correct = spell(voikko, request.data.word);
        if (words.length <= 1 && !correct[0].correct) {
            createRootmenu();
            createAddWordToDictionaryMenuItem(request.data.word, sendResponse);
            chrome.contextMenus.onHidden.addListener(removeMenus);
            chrome.contextMenus.refresh();

            return true;
        }
        // 1 = word is correct, don't do anything.
        else if (words.length === 1) {
            sendResponse({ name: 'replace_word', data: { word: null, } });
            return true;
        }

        createRootmenu();
        words.forEach((w, i) => {
            chrome.contextMenus.create({
                id: i.toString(),
                title: w,
                parentId: ROOTMENU_ID,
                onclick: () => replaceWordWithSuggestion(w, sendResponse),
            });
        });

        chrome.contextMenus.create({
            id: 'separator1',
            type: 'separator',
            parentId: ROOTMENU_ID,
        });
        createAddWordToDictionaryMenuItem(request.data.word, sendResponse);

        chrome.contextMenus.onHidden.addListener(removeMenus);
        chrome.contextMenus.refresh();
        return true;
    }
    else if (request.name === 'inject_scripts') {
        injectScripts(request.tabId);
        return true;
    }
    else
        response = { error: 'Invalid name' };

    sendResponse(response);
    return true;
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
            '*[spellcheck=true]',
            '*[contenteditable=true]',
        ];
        options = {
            spellSelectors: highlightedElements.join(','),
            spellHighlight: {
                code: '',
                class: 'user-highlight',
            },
        };

        // XXX New options here, add to update too.
        options.sidebar_textarea_rows = 30;
        options.sidebar_textarea_cols = 50;
        options.dictionary = {};
        options.onOff = {
            enabled: false,
            whitelist: [],
            blacklist: [],
        };
        // End of new options.

        // XXX Shallow copy.
        options.defaults = Object.assign({}, options);
    }
    else if (details.reason === 'update') {
        options = {};
        // Add same new options as in the install.
        chrome.storage.local.get(null, (o) => {
            if (!o.hasOwnProperty('sidebar_textarea_rows'))
                options['sidebar_textarea_rows'] = 30;
            if (!o.hasOwnProperty('sidebar_textarea_cols'))
                options['sidebar_textarea_rows'] = 50;
            if (!o.hasOwnProperty('dictionary'))
                options['dictionary'] = {};
            if (!o.hasOwnProperty['onOff']) {
                options['onOff'] = {
                    enabled: false,
                    whitelist: [],
                    blacklist: [],
                };
            }

        });
    }
    chrome.storage.local.set(options);
};

/** Update dictionary if it changed.
 * @function onOptionsChange
 * @param changes {Object}
 * @param area {String}
 */
const onOptionsChange = async (changes, area) => {
    if (area !== 'local')
        return;

    if (changes.hasOwnProperty('dictionary'))
        g_dictionary = changes['dictionary'].newValue;

    if (changes.hasOwnProperty('onOff')) {
        const cs = {
            allFrames: true,
            css: [
                { file: '/content_scripts/jquery.highlight-within-textarea.css' },
            ],
            js: [
                { file: '/content_scripts/jquery_highlight_combined.js' },
                { file: '/common/spell.js' },
                { file: '/content_scripts/content_script.js' },
            ],
            runAt: 'document_idle',
        };

        const opts = await browser.storage.local.get([ 'spellHighlight', 'onOff' ]);
        if (opts.onOff.enabled) {
            cs.matches = [ '<all_urls>' ];
            cs.excludeGlobs = opts.onOff.blacklist;
        }
        else {
            cs.matches = opts.onOff.whitelist;
            // matches can't be empty.
            if (cs.matches.length === 0)
                cs.matches = [ 'wss://this.doesnt.exist.blaa/', ];
        }

        [
            { code: opts.spellHighlight.code, class: opts.spellHighlight.class },
        ].filter(sp => sp.code)
        .forEach(sp => {
            cs.css.push({ code: `.hwt-content mark.${sp.class} { ${sp.code} }` });
        });

        if (g_scripts)
            g_scripts.unregister();
        g_scripts = await browser.contentScripts.register(cs);
    }
};

chrome.runtime.onInstalled.addListener(setDefaultOptions);
chrome.commands.onCommand.addListener(() => {
    browser.sidebarAction.open();
});
chrome.storage.onChanged.addListener(onOptionsChange);
chrome.storage.local.get(['dictionary'], o => {
    g_dictionary = o.dictionary;
});

Libvoikko({
    onLoad: load,
});
