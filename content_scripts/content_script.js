/** @module content_script */

'use strict';

const HIGHLIGHT_INPUT_CLASSNAME = 'hwt-input';

/**
 * @function isWordChar
 * @param c {String}
 * @returns {Bool}
 */
const isWordChar = (c) => {
    const wordChar = /[a-zöäå-]/i;
    return wordChar.test(c);
};

/**
 * @function findWordStart
 * @param s {String}
 * @param index {Integer}
 * @returns {Integer|undefined}
 */
const findWordStart = (s, index) => {
    let first = undefined;
    for (let i = index; i >= 0 && isWordChar(s[i]); i--)
        first = i;
    return first;
};

/**
 * @function findWordEnd
 * @param s {String}
 * @param index {Integer}
 * @returns {Integer|undefined}
 */
const findWordEnd = (s, index) => {
    let last = undefined;
    for (let i = index; i < s.length && isWordChar(s[i]); i++)
        last = i;
    return last;
};

/**
 * @function findWord
 * @param elem {HTMLElement}
 * @returns {Array|undefined}
 */
const findWord = (elem) => {
    const s = elem.value;
    if (!s || !isWordChar(s[elem.selectionStart]))
        return;

    const first = findWordStart(s, elem.selectionStart);
    if (first === undefined)
        return;

    let last = findWordEnd(s, elem.selectionStart + 1);
    if (last === undefined)
        last = elem.selectionStart;

    const word = s.slice(first, last + 1);
    if (word.startsWith('-') || word.endsWith('-'))
        return;
    return [ word, first, last ];
};

/**
 * @function highlight
 * @async
 * @param ev {Event}
 * @param cursorIndex {Integer|null}
 */
const highlight = async (ev, cursorIndex = null) => {
    const res = await chrome.runtime.sendMessage({
        name: 'spell',
        data: { text: ev.target.value, },
    });
    const highlights = [];
    let index = 0;
    res.data.tokens.forEach(t => {
        const len = t.token.length;
        if (t.correct === false)
            highlights.push([ index, index + len]);
        index += len;
    });
    const options = await browser.storage.sync.get([ 'spellHighlight', 'spellHighlightBackup' ]);
    // TODO Get background and decide whether to use backup.
    const args = { highlight: highlights, };
    if (options.spellHighlight.code)
        args.className = options.spellHighlight.class;
    $(ev.target).highlightWithinTextarea(args);
    ev.target.focus();
    if (cursorIndex !== null) {
        ev.target.selectionStart = cursorIndex;
        ev.target.selectionEnd = cursorIndex;
    }
};

/**
 * First press left mouse button and then right mouse button and find
 * the word the cursor is on and show the menu and suggestions in it.
 * Change the word to a suggestion if wanted. Don't show if the word is
 * correct word.
 * @function suggestWords
 * @async
 * @param ev {Event}
 */
const suggestWords = async (ev) => {
    const cursorIndex = ev.target.selectionStart;

    const [ word, first, last ] = findWord(ev.target);
    if (!word)
        return;

    const res = await chrome.runtime.sendMessage({
        name: 'suggest',
        data: { word: word, },
    });
    if (!res.data.word)
        return;

    let s = ev.target.value.slice(0, first) + res.data.word +
        ev.target.value.slice(last + 1);
    ev.target.value = s;

    highlight(ev, cursorIndex);
};

/**
 * @function addHighlighterToNewNodes
 * @param mutations {MutationRecord[]}
 * @param observer {MutationObserver}
 * @param options {Object}
 */
const addHighlighterToNewNodes = (mutations, observer, options) => {
    mutations.forEach(m => {
        Array.from(m.addedNodes).forEach(n => {
            if (n.matches(options.spellSelectors)) {
                n.addEventListener('input', highlight);
                n.addEventListener('contextmenu', suggestWords);
            }
        });
    });
};

let g_enabled = false,
    g_options = null;
(async () => {
    g_options = await chrome.storage.sync.get(null);
})();
const g_observer = new MutationObserver((mutations, observer) =>
    addHighlighterToNewNodes(mutations, observer, g_options));
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let response = {};

    if (request.name === 'is_enabled') {
        response = { enabled: g_enabled, };
    }
    else if (request.name === 'enable_highlight') {
        const elems = document.querySelectorAll(g_options.spellSelectors);

        if (request.enable) {
            elems.forEach(e => {
                e.addEventListener('input', highlight);
                e.addEventListener('contextmenu', suggestWords);
            });

            g_observer.observe(document.body, { childList: true, subtree: true });

            response = { enabled_highlight: true, };
            g_enabled = true;
        }
        else {
            elems.forEach(e => {
                if (e.classList.contains(HIGHLIGHT_INPUT_CLASSNAME))
                    $(e).highlightWithinTextarea('destroy');
                e.removeEventListener('input', highlight);
                e.removeEventListener('contextmenu', suggestWords);
            });

            g_observer.disconnect();

            response = { enabled_highlight: false, };
            g_enabled = false;
        }
    }

    sendResponse(response);
    return true;
});
