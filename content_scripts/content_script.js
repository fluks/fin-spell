/** @module content_script */

'use strict';

const HIGHLIGHT_INPUT_CLASSNAME = 'hwt-input';

/**
 * @function addHighlighterToNewNodes
 * @param mutations {MutationRecord[]}
 * @param observer {MutationObserver}
 */
const addHighlighterToNewNodes = async (mutations, observer) => {
    const options = await browser.storage.sync.get(null);
    mutations.forEach(m => {
        Array.from(m.addedNodes).forEach(n => {
            if (n.matches(options.spellSelectors)) {
                n.addEventListener('input', spell.highlight);
                n.addEventListener('contextmenu', spell.suggestWords);
            }
        });
    });
};

let g_enabled = false;
const g_observer = new MutationObserver((mutations, observer) =>
    addHighlighterToNewNodes(mutations, observer));
browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    let response = {};

    if (request.name === 'is_enabled') {
        response = { enabled: g_enabled, };
    }
    else if (request.name === 'enable_highlight') {
        const options = await browser.storage.sync.get(null);
        const elems = document.querySelectorAll(options.spellSelectors);

        if (request.enable) {
            elems.forEach(e => {
                e.addEventListener('input', spell.highlight);
                e.addEventListener('contextmenu', spell.suggestWords);
            });

            g_observer.observe(document.body, { childList: true, subtree: true });

            response = { enabled_highlight: true, };
            g_enabled = true;
        }
        else {
            elems.forEach(e => {
                if (e.classList.contains(HIGHLIGHT_INPUT_CLASSNAME))
                    $(e).highlightWithinTextarea('destroy');
                e.removeEventListener('input', spell.highlight);
                e.removeEventListener('contextmenu', spell.suggestWords);
            });

            g_observer.disconnect();

            response = { enabled_highlight: false, };
            g_enabled = false;
        }
    }

    sendResponse(response);
    return true;
});
