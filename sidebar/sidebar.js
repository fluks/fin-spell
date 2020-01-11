/** @module sidebar */
'use strict';

const g_textarea = document.querySelector('textarea');

const copyToClipboard = (e) => {
    e.preventDefault();

    const text = g_textarea.value;
    e.clipboardData.setData('text/plain', text);
    document.removeEventListener('copy', copyToClipboard);
};

const copyAllToClipboard = () => {
    document.addEventListener('copy', copyToClipboard);
    document.execCommand('copy');

};

const onLoad = async (e) => {
    chrome.storage.sync.get(null, (o) => {
        g_textarea.rows = o.sidebar_textarea_rows;
        g_textarea.cols = o.sidebar_textarea_cols;
    });
    const opts = await browser.storage.sync.get([ 'spellHighlight' ]);
    const code = opts.spellHighlight.code;
    if (code) {
        const style = document.createElement('style');
        style.innerHTML = `.hwt-content mark.${opts.spellHighlight.class} { ${code} }`;
        document.body.appendChild(style);
    }
};

g_textarea.addEventListener('input', spell.highlight);
g_textarea.addEventListener('contextmenu', spell.suggestWords);
document.querySelector('#copy-all').addEventListener('click',
    copyAllToClipboard);
document.addEventListener('DOMContentLoaded', onLoad);
