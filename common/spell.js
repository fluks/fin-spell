/** @module spell */

'use strict';

const spell = {
    /**
     * @function isWordChar
     * @param c {String}
     * @returns {Bool}
     */
    isWordChar(c) {
        const wordChar = /[a-zöäå-]/i;
        return wordChar.test(c);
    },

    /**
     * @function findWordStart
     * @param s {String}
     * @param index {Integer}
     * @returns {Integer|undefined}
     */
    findWordStart(s, index) {
        let first = undefined;
        for (let i = index; i >= 0 && spell.isWordChar(s[i]); i--)
            first = i;
        return first;
    },

    /**
     * @function findWordEnd
     * @param s {String}
     * @param index {Integer}
     * @returns {Integer|undefined}
     */
    findWordEnd(s, index) {
        let last = undefined;
        for (let i = index; i < s.length && spell.isWordChar(s[i]); i++)
            last = i;
        return last;
    },

    /**
     * @function findWord
     * @param elem {HTMLElement}
     * @returns {Array|undefined}
     */
    findWord(elem) {
        const s = elem.value;
        if (!s || !spell.isWordChar(s[elem.selectionStart]))
            return;

        const first = spell.findWordStart(s, elem.selectionStart);
        if (first === undefined)
            return;

        let last = spell.findWordEnd(s, elem.selectionStart + 1);
        if (last === undefined)
            last = elem.selectionStart;

        const word = s.slice(first, last + 1);
        if (word.startsWith('-') || word.endsWith('-'))
            return;
        return [ word, first, last ];
    },

    /**
     * @function highlight
     * @async
     * @param ev {Event}
     * @param cursorIndex {Integer|null}
     */
    async highlight(ev, cursorIndex = null) {
        const res = await browser.runtime.sendMessage({
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
        const options = await browser.storage.local.get([ 'spellHighlight' ]);
        const args = { highlight: highlights, };
        if (options.spellHighlight.code)
            args.className = options.spellHighlight.class;
        $(ev.target).highlightWithinTextarea(args);
        ev.target.focus();
        if (cursorIndex !== null) {
            ev.target.selectionStart = cursorIndex;
            ev.target.selectionEnd = cursorIndex;
        }
    },

    /**
     * First press left mouse button and then right mouse button and find
     * the word the cursor is on and show the menu and suggestions in it.
     * Change the word to a suggestion if wanted. Don't show if the word is
     * correct word.
     * @function suggestWords
     * @async
     * @param ev {Event}
     */
    async suggestWords(ev) {
        const cursorIndex = ev.target.selectionStart;

        const [ word, first, last ] = spell.findWord(ev.target);
        if (!word)
            return;

        const res = await browser.runtime.sendMessage({
            name: 'suggest',
            data: { word: word, },
        });
        if (!res.data.word)
            return;

        let s = ev.target.value.slice(0, first) + res.data.word +
            ev.target.value.slice(last + 1);
        ev.target.value = s;

        spell.highlight(ev, cursorIndex);
    },
};
