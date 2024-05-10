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

    text(text, x, y) {
        this.ctx.font = "32px Arial";
        this.ctx.fillStyle = "black";
        this.ctx.fillText(text, x, y);
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
        this.w = this.d = b;
        this.h = h;

        this.clear();

        const c = b / 2;
        const r = b / 2;

        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                for (let z = 0; z < this.d; z++) {
                    if (Math.hypot((y + 0.5) * (r / this.h), x - c + 0.5, z - c + 0.5) <= r) {
                        this.setBlock(x, y, z);
                    }
                } 
            }
        }

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
        for (let y = 0; y < this.h; y++) {
            const marked = Array.from({ length: this.w }, () => 
                Array(this.d).fill(false)
            );
            for (let x = 0; x < this.w; x++) {
                for (let z = 0; z < this.d; z++) {
                    if (this.isBlock(x, y, z)
                        && this.isBlock(x, y + 1, z) 
                        && this.isBlock(x - 1, y, z)
                        && this.isBlock(x, y, z - 1)
                        && this.isBlock(x + 1, y, z)
                        && this.isBlock(x, y, z + 1)) {
                        marked[x][z] = true;
                    }
                }
            }
            console.log(marked);
            for (let x = 0; x < this.w; x++) {
                for (let z = 0; z < this.d; z++) {
                    if (marked[x][z]) {
                        this.removeBlock(x, y, z);
                    }
                }
            }
        }

        return this;
    }

    elevate(e) {
        this.h += e;

        for (let y = 0; y < e; y++) {
            this.blocks.unshift(Array.from({ length: this.w }, (_, x) => Array.from({ length: this.d }, (_, z) => this.blocks[y][x][z])));
        }

        return this;
    }

    arch(h, f = (x) => 0) {
        const cx = this.w / 2;
        const cz = this.d / 2;

        for (let x = 0; x < this.w; x++) {
            const xh = Math.min(this.h, Math.round(h * f((x - cx) / cx)));
            for (let y = 0; y < xh; y++) {
                for (let z = 0; z < this.d; z++) {
                    this.removeBlock(x, y, z);
                }
            }
        }

        for (let z = 0; z < this.d; z++) {
            const zh = Math.min(this.h, Math.round(h * f((z - cz) / cz)));
            for (let y = 0; y < zh; y++) {
                for (let x = 0; x < this.w; x++) {
                    this.removeBlock(x, y, z);
                }
            }
        }
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

    count() {
        let c = 0;
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                for (let z = 0; z < this.d; z++) {
                    c += this.isBlock(x, y, z);
                }
            }
        }
        return c;
    }

    countLevel(level) {
        let c = 0;

        for (let x = 0; x < this.w; x++) {
            for (let z = 0; z < this.d; z++) {
                c += this.isBlock(x, level, z);
            }
        }

        return c;
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

        drawer.text(`${this.step} / ${this.h}`, 20, 40);
        drawer.text(`${this.countLevel(this.step - 1)} blocks`, 20, 70);
    }
}

function exp(w, h) {
    return (x) => -h / w**2 * x**2 + h;
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const drawer = new Drawer(canvas, ctx);
const structure = new Structure().squircle(16, 10, 16, 2).elevate(10).arch(10, exp(0.5, 1));

structure.redraw();

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
- add .hollow() to make hollow
- add .hollow(b) to add base (copy of first layer, b times)

switch between orthogonic and top view with p
move with right mouse click
zoom with + and -
steps with <- and ->

*/
