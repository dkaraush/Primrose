const combiningMarks =
    /(<%= allExceptCombiningMarks %>)(<%= combiningMarks %>+)/g,
    surrogatePair = /(<%= highSurrogates %>)(<%= lowSurrogates %>)/g;

// unicode-aware string reverse
export function reverse(str) {
    str = str.replace(combiningMarks, function (match, capture1,
        capture2) {
        return reverse(capture2) + capture1;
    })
        .replace(surrogatePair, "$2$1");
    let res = "";
    for (let i = str.length - 1; i >= 0; --i) {
        res += str[i];
    }
    return res;
}

export class Cursor {

    static min(a, b) {
        if (a.i <= b.i) {
            return a;
        }
        return b;
    }

    static max(a, b) {
        if (a.i > b.i) {
            return a;
        }
        return b;
    }

    constructor(i, x, y) {
        this.i = i || 0;
        this.x = x || 0;
        this.y = y || 0;
        this.moved = true;
        Object.seal(this);
    }

    clone() {
        return new Cursor(this.i, this.x, this.y);
    }

    toString() {
        return "[i:" + this.i + " x:" + this.x + " y:" + this.y + "]";
    }

    copy(cursor) {
        this.i = cursor.i;
        this.x = cursor.x;
        this.y = cursor.y;
        this.moved = false;
    }

    fullHome() {
        this.i = 0;
        this.x = 0;
        this.y = 0;
        this.moved = true;
    }

    fullEnd(lines) {
        this.i = 0;
        let lastLength = 0;
        for (let y = 0; y < lines.length; ++y) {
            const line = lines[y];
            lastLength = line.length;
            this.i += lastLength;
        }
        this.y = lines.length - 1;
        this.x = lastLength;
        this.moved = true;
    }

    left(lines) {
        if (this.i > 0) {
            --this.i;
            --this.x;
            if (this.x < 0) {
                --this.y;
                const line = lines[this.y];
                this.x = line.length - 1;
            }
        }
        this.moved = true;
    }

    right(lines) {
        const line = lines[this.y];
        if (this.y < lines.length - 1
            || this.x < line.length) {
            ++this.i;
            if (line[this.x] === '\n') {
                this.x = 0;
                ++this.y;
            }
            else {
                ++this.x;
            }
        }
    }

    skipLeft(lines) {
        if (this.x <= 1) {
            this.left(lines);
        }
        else {
            const x = this.x - 1,
                line = lines[this.y],
                word = reverse(line.substring(0, x)),
                m = word.match(/(\s|\W)+/),
                dx = m
                    ? (m.index + m[0].length + 1)
                    : word.length;
            this.i -= dx;
            this.x -= dx;
        }
        this.moved = true;
    }

    skipRight(lines) {
        const line = lines[this.y];
        if (this.x === line.length || line[this.x] === '\n') {
            this.right(lines);
        }
        else {
            const x = this.x + 1,
                subline = line.substring(x),
                m = subline.match(/(\s|\W)+/),
                dx = m
                    ? (m.index + m[0].length + 1)
                    : (subline.length - this.x);
            this.i += dx;
            this.x += dx;
            if (this.x > 0
                && line[this.x - 1] === '\n') {
                --this.x;
                --this.i;
            }
        }
        this.moved = true;
    }

    home() {
        this.i -= this.x;
        this.x = 0;
        this.moved = true;
    }

    end(lines) {
        const line = lines[this.y];
        let dx = line.length - this.x;
        if (line[line.length - 1] === '\n') {
            --dx;
        }
        this.i += dx;
        this.x += dx;
        this.moved = true;
    }

    up(lines) {
        if (this.y > 0) {
            --this.y;
            const line = lines[this.y],
                dx = Math.min(0, line.length - this.x - 1);
            this.x += dx;
            this.i -= line.length - dx;
        }
        this.moved = true;
    }

    down(lines) {
        if (this.y < lines.length - 1) {
            const pLine = lines[this.y];
            ++this.y;
            this.i += pLine.length;

            const line = lines[this.y];
            if (this.x > line.length) {
                let dx = this.x - line.length;
                if (line[line.length - 1] === '\n') {
                    ++dx;
                }
                this.i -= dx;
                this.x -= dx;
            }
        }
        this.moved = true;
    }

    incX(lines, dx) {
        const dir = Math.sign(dx);
        dx = Math.abs(dx);
        if (dir === -1) {
            for (let i = 0; i < dx; ++i) {
                this.left(lines);
            }
        }
        else if (dir === 1) {
            for (let i = 0; i < dx; ++i) {
                this.right(lines);
            }
        }
    }

    incY(lines, dy) {
        const dir = Math.sign(dy);
        dy = Math.abs(dy);
        if (dir === -1) {
            for (let i = 0; i < dy; ++i) {
                this.up(lines);
            }
        }
        else if (dir === 1) {
            for (let i = 0; i < dy; ++i) {
                this.down(lines);
            }
        }
    }

    setXY(lines, x, y) {
        this.y = Math.max(0, Math.min(lines.length - 1, y));
        const line = lines[this.y];
        this.x = Math.max(0, Math.min(line.length, x));
        this.i = this.x;
        for (let i = 0; i < this.y; ++i) {
            this.i += lines[i].length;
        }
        if (this.x > 0
            && line[this.x - 1] === '\n') {
            --this.x;
            --this.i;
        }
        this.moved = true;
    }

    setI(lines, i) {
        this.x = this.i = i;
        this.y = 0;
        let total = 0,
            line = lines[this.y];
        while (this.x > line.length) {
            this.x -= line.length;
            total += line.length;
            if (this.y >= lines.length - 1) {
                this.i = total;
                this.x = line.length;
                this.moved = true;
                break;
            }
            ++this.y;
            line = lines[this.y];
        }
        this.moved = true;
    }
}