/** @module background */

'use strict';

const _ = browser.i18n.getMessage;
const ENABLE = _('browserAction_On'),
    DISABLE = _('browserAction_Off'),
    g_enableButton = document.querySelector('#enable-highlight-button');
let g_enabled = null,
    g_inject = false;

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
        const res = await browser.tabs.sendMessage(tabs[0].id, { enabled: true, });
        g_enableButton.textContent = res.enabled ? DISABLE : ENABLE;
        g_enabled = res.enabled;
    }
    // Content scripts not injected, there's no one listening.
    catch (error) {
        g_enableButton.textContent = ENABLE;
        g_enabled = false;
        g_inject = true;
    }

};

/*
 * @function enableHighlightButtonHandler
 * @async
 * @param ev {Event}
 */
const enableHighlightButtonHandler = async (ev) => {
    const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (g_enabled) {
        browser.tabs.sendMessage(tabs[0].id, { off: true, });
    }
    else if (g_inject) {
        browser.runtime.sendMessage({
            name: 'inject_scripts',
            tabId: tabs[0].id,
        });
    }
    else {
        browser.tabs.sendMessage(tabs[0].id, { on: true, });
    }

    window.close();
};

document.addEventListener('DOMContentLoaded', setup);
g_enableButton.addEventListener('click', enableHighlightButtonHandler);
