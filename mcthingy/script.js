class Drawer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    clear() {
        this.ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }

    guideLines(n, m) {
        const cw = this.canvas.clientWidth / n, 
              ch = this.canvas.clientHeight / m;
        
        this.ctx.lineWidth = 1;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                this.ctx.strokeRect(i * cw, j * ch, cw, ch);
            }
        }
    }

    polygon(points, color) {
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = color;

        this.ctx.beginPath()
        points.forEach(point => {
            this.ctx.lineTo(...point);
        });
        this.ctx.closePath();

        this.ctx.fill();
        this.ctx.stroke();
    }

    cube(x, y, w, h, p, colors) {
        this.polygon([
            [x, y],
            [x + w / 2, y + p * h],
            [x + w / 2, y + p * h + h],
            [x, y + h]
        ], colors.left);

        this.polygon([
            [x + w, y],
            [x + w / 2, y + p * h],
            [x + w / 2, y + p * h + h],
            [x + w, y + h]
        ], colors.right);

        this.polygon([
            [x, y],
            [x + w / 2, y - p * h],
            [x + w, y],
            [x + w / 2, y + p * h]
        ], colors.top);
    }

    rect(x, y, w, h, color) {
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = color;

        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeRect(x, y, w, h);
    }

    structureOrthogonal(struct, x, y, w, h, p) {
        const px = x, py = y;

        for (let y = 0; y < Math.min(struct.h, struct.step); y++) {
            for (let x = 0; x < struct.w; x++) {
                for (let z = 0; z < struct.d; z++) {
                    if (struct.isBlock(x, y, z) 
                            && (!struct.isBlock(x + 1, y, z)
                                || !struct.isBlock(x, y + 1, z) 
                                || !struct.isBlock(x, y, z + 1) 
                                || y == struct.step - 1)) {
                        drawer.cube(
                            px - z * w / 2 + x * w / 2, 
                            py + z * 0.3 * h + x * 0.3 * h - y * h, 
                            w, h, p, y == struct.step - 1 ? {
                                left: "green",
                                right: "red",
                                top: "blue"
                            } : {
                                left : "lightGreen",
                                right: "pink",
                                top: "lightBlue"
                            }
                        );
                    }
                }
            }
        }
    }

    structureTop(struct, x, y, w, h) {
        const px = x, py = y;

        for (let x = 0; x < struct.w; x++) {
            for (let z = 0; z < struct.d; z++) {
                if (struct.isBlock(x, struct.step, z)) {
                    this.rect(px + z * w, py + x * h, w, h, "blue");
                } else if (struct.isBlock(x, struct.step - 1, z)) {
                    this.rect(px + z * w, py + x * h, w, h, "lightBlue");
                }
            }
        }
    }
}

class Structure {
    constructor() {
        this.blocks = [];

        this.w = 0;
        this.h = 0;
        this.d = 0;

        this.x = drawer.canvas.clientWidth / 2;
        this.y = drawer.canvas.clientHeight / 2;

        this.scale = 1;
        this.step = 1;
        this.topView = false;
    }
    
    clear() {
        this.blocks = Array.from({ length: this.h }, () =>
            Array.from({ length: this.w }, () => Array(this.d).fill(false))
        );

        return this;
    }

    pyramid(w, h, d) {
        this.w = w;
        this.h = h;
        this.d = d;

        this.clear();

        for (let y = 0; y < this.h; y++) {
            const ox = Math.floor(y / this.h / 2 * this.w);
            for (let x = ox; x < this.w - ox; x++) {
                const oz = Math.floor(y / this.h / 2 * this.d);
                for (let z = oz; z < this.d - oz; z++) {
                    this.setBlock(x, y, z);
                }
            }
        }

        this.redraw();

        return this;
    }

    dome(b, h) {
        this.squircle(b, h, 2, 2)

        this.redraw();

        return this;
    }

    squircle(b, h, u, v) {
        this.w = this.d = b;
        this.h = h;

        this.clear();

        const c = b / 2;

        for (let y = 0; y < this.h; y++) {
            const r = b / 2 * Math.cos(Math.asin(y / this.h));
            const q = u - (u - v) * (y / this.h);
            
            for (let x = 0; x < this.w; x++) {
                for (let z = 0; z < this.d; z++) {
                    if (Math.abs((z + 0.5) - c)**q + Math.abs((x + 0.5) - c)**q <= r**q) {
                        this.setBlock(x, y, z);
                    }
                } 
            }
        }

        this.redraw();

        return this;
    }

    hollow() {
        // upcoming feature!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        return this;
    }

    inBox(x, y, z) {
        return x >= 0 && x < this.w 
            && y >= 0 && y < this.h 
            && z >= 0 && z < this.d;
    }

    isBlock(x, y, z) {
        return this.inBox(x, y, z) && this.blocks[y][x][z];
    }

    setBlock(x, y, z) {
        if (this.inBox(x, y, z)) {
            this.blocks[y][x][z] = true;
        }
    }

    removeBlock(x, y, z) {
        if (this.inBox(x, y, z)) {
            this.blocks[y][x][z] = false;
        }
    }

    redraw() {
        drawer.clear();

        if (this.topView) {
            const w = this.scale * 45, h = this.scale * 45;

            const cw = this.d * w / 2;
            const ch = this.w * h / 2;

            drawer.structureTop(this, this.x - cw, this.y - ch, w, h);
        } else {
            const w = this.scale * 75;
            const h = this.scale * 45;
            const p = 0.3;

            const cw = (this.d + this.w) * w / 2;
            const ch = (this.d + this.w) * h * p;
    
            drawer.structureOrthogonal(this, 
                this.x - cw / 2 + this.d * w / 2 - w / 2, 
                this.y - ch / 2, w, h, p
            );
        }
    }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const drawer = new Drawer(canvas, ctx);
const structure = new Structure().squircle(50, 25, 2, 3);

structure.redraw(75, 50, 0.3);

window.addEventListener("keydown", event => {
    switch (event.key) {
        case "ArrowLeft":
            if (structure.step > 1) {
                structure.step--;
                structure.redraw();
            }
            break;
    
        case "ArrowRight":
            if (structure.step < structure.h) {
                structure.step++;
                structure.redraw();
            }
            break;

        case "-":
            structure.scale /= 1.1;
            structure.redraw();
            break;

        case "=":
            structure.scale *= 1.1;
            structure.redraw();
            break;

        case "p":
            structure.topView = !structure.topView;
            structure.redraw();
            break;

        default:
            break;
    }
});

canvas.addEventListener("contextmenu", event => {
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();

    const dx = canvas.clientWidth / 2 - (event.clientX - rect.left);
    const dy = canvas.clientHeight / 2 - (event.clientY - rect.top);
    structure.x += dx;
    structure.y += dy;

    structure.redraw();
});

/*

tutorial
in console:
- structure.pyramid(width, height, depth);
- structure.dome(base, height);
- structure.squircle(base, height, a, b);
  where a is circleness at start and b is circleness at end
    circleness: 2 = perfect circle, >> 2 is squarelike

switch between orthogonic and top view with p
move with right mouse click
zoom with + and -
steps with <- and ->

*/
