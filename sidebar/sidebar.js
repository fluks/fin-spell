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
    const opts = await browser.storage.local.get(null);
    const code = opts.spellHighlight.code;
    if (code) {
        const style = document.createElement('style');
        style.innerHTML = `.hwt-content mark.${opts.spellHighlight.class} { ${code} }`;
        document.body.appendChild(style);
    }
    g_textarea.rows = opts.sidebar_textarea_rows;
    g_textarea.cols = opts.sidebar_textarea_cols;
};

g_textarea.addEventListener('input', spell.highlight);
g_textarea.addEventListener('contextmenu', spell.suggestWords);
document.querySelector('#copy-all').addEventListener('click',
    copyAllToClipboard);
document.addEventListener('DOMContentLoaded', onLoad);
