/** @module background */

'use strict';

const ENABLE = 'Päälle',
    DISABLE = 'Pois',
    g_enableButton = document.querySelector('#enable-highlight-button');
let g_isEnabled = null;

/**
 * @function setup
 * @async
 * @param ev {Event}
 */
const setup = async (ev) => {
    try {
        const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });
        const r = await browser.tabs.sendMessage(tabs[0].id,
            { name: 'is_enabled', });
        g_enableButton.textContent = r.enabled ? DISABLE : ENABLE;
        g_isEnabled = r.enabled;
    }
    // Content scripts not injected.
    catch (error) {
        console.log('scripts not injected');
        g_enableButton.textContent = ENABLE;
    }
};

/*
 * @function enableHighlight
 * @async
 * @param tabId {Integer}
 * @param enable {Boolean}
 * @param button {HTMLElement}
 */
const enableHighlight = async (tabId, enable, button) => {
    const res = await browser.tabs.sendMessage(tabId, {
        name: 'enable_highlight',
        enable: enable,
    });
    if (res.enabled_highlight) {
        button.textContent = enable ? DISABLE : ENABLE;
        g_isEnabled = enable;
    }
};

/*
 * @function enableHighlightButtonHandler
 * @async
 * @param ev {Event}
 */
const enableHighlightButtonHandler = async (ev) => {
    try {
        const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (g_isEnabled === null) {
            console.log('injecting scripts');
            let res = await browser.runtime.sendMessage({
                name: 'inject_scripts',
                tabId: tabs[0].id,
            });
            // TODO Returns before scripts are ready to use. Either send message
            // from a script that it's ready or set a timer if browser action
            // shares scope with content scripts.
            if (res.injected) {
                setTimeout(() => enableHighlight(tabs[0].id, true, ev.target), 100);
            }
        }
        else if (!g_isEnabled)
            enableHighlight(tabs[0].id, true, ev.target);
        else
            enableHighlight(tabs[0].id, false, ev.target);
    }
    catch (error) {
        console.log(error);
    }
};

document.addEventListener('DOMContentLoaded', setup);
g_enableButton.addEventListener('click', enableHighlightButtonHandler);