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

const onLoad = (e) => {
    chrome.storage.sync.get(null, (o) => {
        g_textarea.rows = o.sidebar_textarea_rows;
        g_textarea.cols = o.sidebar_textarea_cols;
    })
};

g_textarea.addEventListener('input', spell.highlight);
g_textarea.addEventListener('contextmenu', spell.suggestWords);
document.querySelector('#copy-all').addEventListener('click',
    copyAllToClipboard);
document.addEventListener('DOMContentLoaded', onLoad);
