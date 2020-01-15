/** @module content_script */

'use strict';

const HIGHLIGHT_INPUT_CLASSNAME = 'hwt-input';
let g_enabled = false;

/**
 * Add event listeners and disable native spellcheck for spell checked
 * elements.
 * @function modifyForSpelling
 * @param elem {HTMLElement}
 */
const modifyForSpelling = (elem) => {
    elem.addEventListener('input', spell.highlight);
    elem.addEventListener('contextmenu', spell.suggestWords);
    elem.setAttribute('spellcheck', 'false');
};


/**
 * @function addHighlighterToNewNodes
 * @param mutations {MutationRecord[]}
 * @param observer {MutationObserver}
 */
const addHighlighterToNewNodes = async (mutations, observer) => {
    const options = await browser.storage.local.get(null);
    mutations.forEach(m => {
        Array.from(m.addedNodes).forEach(n => {
            if (n.matches(options.spellSelectors)) {
                modifyForSpelling(n);
            }
        });
    });
};

const g_observer = new MutationObserver((mutations, observer) =>
    addHighlighterToNewNodes(mutations, observer));

const enableHighlight = async (enable) => {
    const options = await browser.storage.local.get(null);
    const elems = document.querySelectorAll(options.spellSelectors);

    if (enable) {
        elems.forEach(e => modifyForSpelling(e));

        g_observer.observe(document.body, { childList: true, subtree: true });
    }
    else {
        elems.forEach(e => {
            if (e.classList.contains(HIGHLIGHT_INPUT_CLASSNAME))
                $(e).highlightWithinTextarea('destroy');
            e.removeEventListener('input', spell.highlight);
            e.removeEventListener('contextmenu', spell.suggestWords);
            e.setAttribute('spellcheck', 'true');
        });

        g_observer.disconnect();
    }
};

enableHighlight(true);
g_enabled = true;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let response = {};

    if (request.name === 'is_enabled') {
        sendResponse({ enabled: g_enabled, });
        return true;
    }
    else if (request.name === 'enable_highlight') {
        if (request.enable) {
            enableHighlight(true);
            g_enabled = true;
        }
        else {
            enableHighlight(false);
            g_enabled = false;
        }
    }
});
