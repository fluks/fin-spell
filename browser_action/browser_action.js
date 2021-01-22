/** @module background */

'use strict';

const _ = browser.i18n.getMessage;

const ENABLE = _('browserAction_On'),
    DISABLE = _('browserAction_Off'),
    g_enableButton = document.querySelector('#enable-highlight-button');

/**
 * @function setup
 * @async
 * @param ev {Event}
 */
const setup = async (ev) => {
    const opts = await browser.storage.local.get([ 'onOff' ]);
    g_enableButton.textContent = opts.onOff.enabled ? DISABLE : ENABLE;
};

/*
 * @function enableHighlightButtonHandler
 * @async
 * @param ev {Event}
 */
const enableHighlightButtonHandler = async (ev) => {
    const opts = await browser.storage.local.get([ 'onOff' ]);
    opts.onOff.enabled = !opts.onOff.enabled;
    browser.storage.local.set({ onOff: opts.onOff });

    window.close();
};

document.addEventListener('DOMContentLoaded', setup);
g_enableButton.addEventListener('click', enableHighlightButtonHandler);
