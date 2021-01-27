/** @module content_script */

'use strict';

const HIGHLIGHT_INPUT_CLASSNAME = 'hwt-input';
let g_enabled = true;

/* Without the delay the target element doesn't yet contain the pasted text.
 * @function delayedSpellHighlight
 * @param {ClipboardEvent}
 */
const delayedSpellHighlight = (e) => {
    window.setTimeout(() => spell.highlight(e), 100);
};

/**
 * Add event listeners and disable native spellcheck for spell checked
 * elements.
 * @function modifyForSpelling
 * @param elem {HTMLElement}
 */
const modifyForSpelling = (elem) => {
    elem.addEventListener('keyup', spell.highlight);
    elem.addEventListener('click', spell.highlight);
    elem.addEventListener('paste', delayedSpellHighlight);
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
            e.removeEventListener('keyup', spell.highlight);
            e.removeEventListener('click', spell.highlight);
            e.removeEventListener('paste', delayedSpellHighlight);
            e.removeEventListener('contextmenu', spell.suggestWords);
            e.setAttribute('spellcheck', 'true');
        });

        g_observer.disconnect();
    }
};

enableHighlight(true);

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.off) {
        enableHighlight(false);
        g_enabled = false;
    }
    else if (request.on) {
        enableHighlight(true);
        g_enabled = true;
    }
    else if (request.enabled) {
        sendResponse({ enabled: g_enabled });
    }
    return true;
});
