/** @module content_script */

'use strict';

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
 * @function highligth
 * @async
 * @param ev {Event}
 */
const highligth = async (ev) => {
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
    $(ev.target).highlightWithinTextarea({ highlight: highlights });
    ev.target.focus();
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

    highligth(ev);
};

document.querySelectorAll('input[type=search],input[type=text],textarea')
    .forEach(elem => {
        // Works but not inputs and can change the element's UI.
        elem.addEventListener('keyup', highligth);
        elem.addEventListener('contextmenu', suggestWords);
    }
);
