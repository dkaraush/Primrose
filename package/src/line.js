﻿export class Line {
    constructor(txt, tokens, startStringIndex, startTokenIndex, lineNumber) {
        this.text = txt;
        this.startStringIndex = startStringIndex;
        this.stringLength = txt.length;
        this.endStringIndex = this.startStringIndex + this.stringLength;

        this.tokens = tokens;
        this.startTokenIndex = startTokenIndex;
        this.numTokens = tokens.length;
        this.endTokenIndex = this.startTokenIndex + this.numTokens;

        this.lineNumber = lineNumber;

        const graphemes = Object.freeze([...txt]),
            leftCorrections = new Array(txt.length),
            rightCorrections = new Array(txt.length);

        let x = 0;
        for (let grapheme of graphemes) {
            leftCorrections[x] = 0;
            rightCorrections[x] = 0;
            for (let i = 1; i < grapheme.length; ++i) {
                leftCorrections[x + i] = -i;
                rightCorrections[x + i] = grapheme.length - i;
            }
            x += grapheme.length;
        }

        this.adjust = (cursor, dir) => {
            const correction = dir === -1
                ? leftCorrections
                : rightCorrections;

            if (cursor.x < correction.length) {
                const delta = correction[cursor.x];
                cursor.x += delta;
                cursor.i += delta;
            }
            else if (dir === 1
                && txt[txt.length - 1] === '\n') {
                this.adjust(cursor, -1);
            }
        };

        this.toString = () => txt;

        this.substring = (x, y) => txt.substring(x, y);

        Object.seal(this);
    }
}

Line.emptyLine = (startStringIndex, startTokenIndex, lineNumber) => new Line("", [], startStringIndex, startTokenIndex, lineNumber);