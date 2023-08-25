class Player {
    constructor(human, hidden) {
        this.layout = [];
        this.other = undefined;
        this.damage = [];
        this.human = human;
        this.isSetUp = !human;
        this.hidden = hidden;
        this.reset();
        if (!human) {
            this.autoSetup();
        }
    }

    reset() {
        for (let i = 0; i < SHIP_SIZES.length; i++) {
            this.damage[i] = 0;
        }
        for (let y = 0; y < HEIGHT; y++) {
            this.layout[y] = [];
            for (let x = 0; x < WIDTH; x++) {
                this.layout[y][x] = new Cell();
            }
        }
    }

    autoSetup() {
        const ship = new FloatingShip(0);
        for (let i = 1; i < SHIP_SIZES.length; i++) {
            ship.type = i;
            do {
                ship.x = randInt(0, WIDTH);
                ship.y = randInt(0, HEIGHT);
                ship.rotation = randInt(0, 4);
                ship.makeCells();
            } while (!this.shipFits(ship));
            this.putShip(ship);
        }
    }

    autoMove() {
        awaitingInput = false;
        let weightMap = [];
        let shots = [];
        for (let y = 0; y < HEIGHT; y++) {
            weightMap[y] = [];
            for (let x = 0; x < WIDTH; x++) {
                weightMap[y][x] = 0;
                if (this.other.layout[y][x].hit) {
                    shots.push([x, y]);
                }
            }
        }
        let fun;
        if (shots.length) { // searching for ship
            fun = (x, y) => smallestDistance([x, y], shots);
        } else { // first shot
            const p = (WIDTH - 1) / 2;
            const q = (HEIGHT - 1) / 2;
            fun = (x, y) => x * ((2 * p - x) / (p**2)) * y * ((2 * q - y) / (q**2));
        }
        // TODO: better ship targeting
        let max = 0;
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const value = fun(x, y);
                if (value > max) {
                    max = value;
                }
                weightMap[y][x] = value;
                this.other.layout[y][x].backgroundValue = value / max;
            }
        }
        const pos = weighted2DRandom(weightMap);
        draw();
        setTimeout(() => this.other.shoot(pos[1], pos[0]), PRE_SHOT_DELAY);
    }

    draw() {
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                this.layout[y][x].drawLeft(
                    getCell(tableLeft, x, y), false, this.hidden
                );
                this.other.layout[y][x].drawRight(
                    getCell(tableRight, x, y)
                )
            }
        }
    }

    shipFits(ship) {
        return !walk(ship.x, ship.y, ship.rotation, ship.size, (x, y, _) => {
            return isOutsideBoard(x, y) || this.layout[y][x].type;
        });
    }

    putFloatingShip() {
        if (!this.shipFits(floating)) {
            return;
        }
        this.putShip(floating);
        currentShip++;
        if (currentShip >= SHIP_SIZES.length) {
            this.isSetUp = true;
            if (!this.other.isSetUp) {
                turn = turn ? 0 : 1;
                currentShip = 1;
            } else {
                awaitingInput = true;
            }
        }
        if (currentShip < SHIP_SIZES.length) {
            floating.type = currentShip;
            floating.makeCells();
        } else {
            floating = undefined;
        }
        draw();
    }

    putShip(ship) {
        walk(ship.x, ship.y, ship.rotation, ship.size, (x, y, i) => {
            this.layout[y][x] = ship.cells[i];
        })
    }

    shoot(x, y) {
        const cell = this.layout[y][x];
        cell.hit = true;
        if (cell.type) {
            this.damage[cell.type]++;
        }
        draw();
        awaitingInput = false;
        setTimeout(() => {
            turn = turn ? 0 : 1;
            if (!players[turn].human) {
                players[turn].autoMove();
            }
            awaitingInput = true;
            draw();
        }, POST_SHOT_DELAY);
    }
}

class Cell {
    constructor() {
        // 0 -> empty, other -> length of ship
        this.type = 0;
        this.hit = false;
        this.rotation = 0;
        this.graphic = undefined;
        this.backgroundValue = 0;
    }

    drawLeft(td, error=false, hidden=false) {
        if (td.childNodes) {
            td.innerHTML = "";
        }
        if (this.graphic && !hidden) {
            const svg = graphics[this.graphic].cloneNode(true);
            if (this.rotation) {
                svg.style.transform = `rotate(${90 * this.rotation}deg)`;
            }
            if (error || this.hit) {
                svg.classList.add("dark");
            }
            td.appendChild(svg);
        }
    }

    drawRight(td) {
        if (td.childNodes) {
            td.innerHTML = "";
        }
        if (this.backgroundValue) {
            td.style.backgroundColor = `rgb(0, ${Math.floor(255 * (this.backgroundValue))}, 0)`;
        } else {
            td.style.removeProperty("background-color");
        }
        if (!this.hit) {
            return;
        }
        let svg;
        if (this.type) {
            svg = graphics.shotHit.cloneNode(true);
        } else {
            svg = graphics.shotMiss.cloneNode(true);
        }
        td.appendChild(svg);
    }
}

class FloatingShip {
    constructor(type) {
        this.type = type;
        this.size = undefined;
        this.rotation = 0;
        this.x = -1;
        this.y = -1;
        this.cells = [];
        this.makeCells();
    }

    makeCells() {
        this.size = SHIP_SIZES[this.type];
        for (let i = 0; i < this.size; i++) {
            const cell = new Cell();
            cell.type = this.type;
            if (i === 0) {
                cell.graphic = "back";
            } else if (i === this.size - 1) {
                cell.graphic = "front";
            } else {
                cell.graphic = "middle";
            }
            this.cells[i] = cell;
        }
        this.updateCells();
    }

    updateCells() {
        for (let i = 0; i < this.size; i++) {
            this.cells[i].rotation = this.rotation;
        }
    }

    draw() {
        if (this.x === -1 || this.y === -1) {
            return;
        }
        const fits = players[turn].shipFits(this);
        walk(this.x, this.y, this.rotation, this.size, (x, y, i) => {
            if (isOutsideBoard(x, y)) {
                return 1;
            }
            const cell = getCell(tableLeft, x, y);
            this.cells[i].drawLeft(cell, fits ? undefined : "#005500");
        });
    }
}

function walk(x, y, d, n, fun) {
    const dx = [0, -1, 0, 1][d];
    const dy = [1, 0, -1, 0][d];
    for (let i = 0; i < n; i++) {
        if (fun(x, y, i)) {
            return 1;
        }
        x += dx;
        y += dy;
    }
    return 0;
}

function smallestDistance(target, points) {
    let d = [];
    for (let i = 0; i < points.length; i++) {
        d[i] = Math.hypot(points[i][1] - target[1], points[i][0] - target[0]);
    }
    return Math.min(...d);
}

function isOutsideBoard(x, y) {
    return x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT;
}

function arraySum(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum;
}

function randInt(a, b) {
    return Math.floor(Math.random() * (b - a)) + a;
}

function weighted2DRandom(weightMap) {
    const sum = arraySum(weightMap.map(arraySum));
    let value = Math.random() * sum;
    for (let i = 0; i < weightMap.length; i++) {
        for (let j = 0; j < weightMap[i].length; j++) {
            if (weightMap[i][j] >= value) {
                return [i, j];
            }
            value -= weightMap[i][j];
        }
    }
    throw new Error("oops");
}

function buildTable(table, rows, cols, fun) {
    table.innerHTML = "";
    for (let i = 0; i < rows; i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < cols; j++) {
            const td = document.createElement("td");
            fun(td);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
}

function getCell(table, x, y) {
    return table.childNodes[y].childNodes[x];
}

function getPos(td) {
    return [td.cellIndex, td.parentNode.rowIndex]
}

function updateTextBox() {
    if (floating) {
        textBoxLeft.innerHTML = SHIP_NAMES[currentShip];
    } else if (mousePos) {
        if (mousePos[0] === 0) {
            const type = players[turn].layout[mousePos[2]][mousePos[1]].type;
            if (type) {
                const damage = players[turn].damage[type] / SHIP_SIZES[type];
                textBoxLeft.innerHTML = `${SHIP_NAMES[type]} - ${Math.round((1 - damage) * 100)}%`;
            } else {
                textBoxLeft.innerHTML = "&nbsp;";
            }
        } else {
            const cell = players[turn].other.layout[mousePos[2]][mousePos[1]];
            if (cell.type && cell.hit) {
                const damage = players[turn].other.damage[cell.type] / SHIP_SIZES[cell.type];
                textBoxRight.innerHTML = `${SHIP_NAMES[cell.type]} - ${Math.round((1 - damage) * 100)}%`;
            } else {
                textBoxRight.innerHTML = "&nbsp;";
            }
        }
    } else {
        textBoxLeft.innerHTML = "&nbsp;";
        textBoxRight.innerHTML = "&nbsp;";
    }
}

function draw() {
    players[turn].draw();
    floating?.draw();
    updateTextBox();
}

function init() {
    buildTable(tableLeft, WIDTH, HEIGHT, td => td.classList.add("cell", "cell-left"));
    buildTable(tableRight, WIDTH, HEIGHT, td => td.classList.add("cell", "cell-right"));
    players[0].other = players[1];
    players[1].other = players[0];
    if (!players[0].human) {
        players[0].autoMove();
    }
}

const WIDTH = 8;
const HEIGHT = 8;
const PRE_SHOT_DELAY = 500;
const POST_SHOT_DELAY = 500;
const SHIP_NAMES = [
    undefined, "CARRIER", "BATTLESHIP", "CRUISER", "SUBMARINE", "DESTROYER"
];
const SHIP_SIZES = [0, 5, 4, 3, 3, 2];

const graphics = {
    back: document.getElementById("ship-back"),
    middle: document.getElementById("ship-middle"),
    front: document.getElementById("ship-front"),
    shotHit: document.getElementById("shot-hit"),
    shotMiss: document.getElementById("shot-miss")
};
const tableLeft = document.getElementById("table-left");
const tableRight = document.getElementById("table-right");
const textBoxLeft = document.getElementById("text-box-left");
const textBoxRight = document.getElementById("text-box-right");
const players = [
    new Player(true, false), new Player(false, true)
];

let awaitingInput = false;
let mousePos = undefined;
let turn = 0;
let currentShip = 1;
let floating = players[0].human ? new FloatingShip(currentShip) : undefined;

window.addEventListener("mousemove", event => {
    if (event.target.classList.contains("cell")) {
        const pos = getPos(event.target);
        if (event.target.classList.contains("cell-left")) {
            mousePos = [0, ...pos];
            if (floating && (floating.x !== pos[0] || floating.y !== pos[1])) {
                floating.x = pos[0];
                floating.y = pos[1];
                draw();
            }
        } else {
            mousePos = [1, ...pos];
        }
    } else {
        mousePos = undefined;
    }
    updateTextBox();
});

window.addEventListener("click", event => {
    if (event.target.classList.contains("cell-left") && floating) {
        players[turn].putFloatingShip();
    } else if (event.target.classList.contains("cell-right") && awaitingInput && players[turn].human) {
        const pos = getPos(event.target);
        if (players[turn].other.layout[pos[1]][pos[0]].hit) {
            return;
        }
        players[turn].other.shoot(...pos);
    }
});

window.addEventListener("keydown", event => {
    if (event.code === "ArrowRight" && floating) {
        floating.rotation = (floating.rotation + 1) % 4;
        floating.updateCells();
    } else if (event.code === "ArrowLeft" && floating) {
        floating.rotation = (floating.rotation + 3) % 4;
        floating.updateCells();
    } else if (event.code === "KeyS") {
        turn = turn ? 0 : 1;
    } else {
        return;
    }
    draw();
});

init();
draw();
