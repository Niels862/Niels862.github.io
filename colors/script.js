class Animation {
    constructor(d) {
        this.t = Date.now();
        this.d = d;
    }

    frame(t) {
        this.draw(fgCtx, this.done(t) ? 1 : ((t - this.t) / this.d));
    }

    stamp() {
        this.draw(bgCtx, 1);
    }

    done(t) {
        return this.t + this.d < t;
    }

    draw(ctx, p) {}
}

class TriangleRing extends Animation {
    constructor() {
        super(randInt(500, 4000));
        this.n = [4, 6, 8, 12, 16][randInt(0, 5)];
        this.color = constant(randColor());
        this.base = sinTrans(randInt(0, 100), randInt(25, 200));
        this.top = sinTrans(randInt(-100, 400), randInt(-100, 400));
        this.height = sinTrans(0, randInt(25, 400));
        this.spin = sinTrans((Math.random() - 0.5) * 4 * Math.PI, 0);
    }

    draw(ctx, p) {
        ctx.fillStyle = this.color(p);
        ctx.beginPath();
        for (let i = 0; i < this.n; i++) {
            const a = i / this.n * 2 * Math.PI + this.spin(p);
            ctx.moveTo(...rotate(
                CENTER_X + this.top(p),
                CENTER_Y, CENTER_X, CENTER_Y, a
            ));
            for (let j = -1; j < 2; j += 2) {
                ctx.lineTo(...rotate(
                    CENTER_X + this.top(p) + this.height(p),
                    CENTER_Y + j * this.base(p),
                    CENTER_X, CENTER_Y, a
                ));
            }
        }
        ctx.fill();
    }
}

class Circle extends Animation {
    constructor() {
        super(randInt(500, 1000));
        this.color = constant(randColor());
        this.r = sinTrans(0, Math.hypot(CENTER_X, CENTER_Y));
    }

    draw(ctx, p) {
        ctx.fillStyle = this.color(p);
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, this.r(p), 0, 2 * Math.PI);
        ctx.fill();
    }
}

function randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a));
}

// https://gist.github.com/mjackson/5311256
function RGBToHSL(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b);
    let h, s;
    let l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

function randColor() {
    if (Array.isArray(COLOR_CYCLE)) {
        const hsl = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            hsl[i] = COLOR_CYCLE[cycleIndex][i] + randInt(-COLOR_CYCLE_VARIATION[i], COLOR_CYCLE_VARIATION[i]);
            if (i && hsl[i] > 100) {
                hsl[i] = 100;
            } else if (i && hsl[i] < 0) {
                hsl[i] = 0;
            }
        }
        if (hsl[0] > 360) {
            hsl[0] = 360;
        }
        cycleIndex = (cycleIndex + 1) % COLOR_CYCLE.length;
        return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
    }
    let hue;
    if (COLOR_CYCLE) {
        hue = Date.now() / COLOR_CYCLE % 1 * 360 + randInt(-COLOR_CYCLE_VARIATION[0], COLOR_CYCLE_VARIATION[0]);
    } else {
        hue = randInt(...COLOR_THEME.hue);
    }
    return `hsl(${hue}, ${randInt(...COLOR_THEME.saturation)}%, ${randInt(...COLOR_THEME.lightness)}%)`;
}

function randWeighted(arr) {
    let r = Math.random();
    for (let i = 0; i < arr.length; i++) {
        const element = arr[i];
        if (r <= element[0]) {
            return element[1];
        }
        r -= element[0];
    }
    throw new Error("oops");
}

function rotate(x, y, pivotX, pivotY, rotation) {
    const d = Math.hypot(pivotY - y, pivotX - x);
    const a = Math.atan2(pivotY - y, pivotX - x) + rotation;
    return [
        pivotX + d * Math.cos(a),
        pivotY + d * Math.sin(a)
    ]
}

function linTrans(a, b) {
    return p => p * (b - a) + a;
}

function sinTrans(a, b, range=1) {
    return p => Math.sin((p * Math.PI / 2) * range) * (b - a) / Math.sin(Math.PI / 2 * range) + a;
}

function constant(a) {
    return p => a;
}

function draw() {
    const t = Date.now();
    fgCtx.clearRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < active.length; i++) {
        const anim = active[i];
        if (anim.done(t) && !i) {
            anim.stamp();
            active.splice(i, 1);
            i--;
        } else {
            anim.frame(t);
        }
    }
    if (Math.random() < NEW_CHANCE && active.length < MAX_ACTIVE) {
        active.push(
            new (randWeighted(WEIGHTS))()
        );
    }
}

function loop() {
    draw();
    requestAnimationFrame(loop);
}

function init() {
    bgCtx.fillStyle = randColor();
    bgCtx.fillRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < 3; i++) {
        (new TriangleRing()).stamp();
    }
}

const WIDTH = 800;
const HEIGHT = 800;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const MAX_ACTIVE = 50;
const NEW_CHANCE = 0.05;
const COLOR_THEME = {
    hue: [0, 360],
    saturation: [50, 50],
    lightness: [20, 80]
};
const COLOR_CYCLE = [
    [180, 50, 50]
];
const COLOR_CYCLE_VARIATION = [
    180, 50, 50
];
const WEIGHTS = [
    [1, TriangleRing],
    [0, Circle]
];

const bgCanvas = document.getElementById("bg-canvas");
const bgCtx = bgCanvas.getContext("2d");
const fgCanvas = document.getElementById("fg-canvas");
const fgCtx = fgCanvas.getContext("2d");
const active = [];

let cycleIndex = 0;

init();
loop();
