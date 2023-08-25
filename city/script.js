class Flat {
    constructor(x, floors=1) {
        this.type = "flat";
        this.x = x;
        this.width = 1;
        this.floors = floors;
        this.floorCap = randInt(1, 10);
        this.floorConstruction = undefined;
        this.palette = [randomColor(), "lightBlue", randomColor()];
        this.fire = -1;
    }
    setup() {
        counts.flats++;
    }
    draw() {
        drawModel(models.flatBase, this.x * gridSize, streetY, scale, this.palette);
        for (let i = 1; i < this.floors; i++) {
            drawModel(models.flat, this.x * gridSize, streetY - i * gridSize, scale, this.palette);
        }
        if (this.floorConstruction) {
            drawModel(models.construction, this.x * gridSize, streetY - this.floors * gridSize, scale, ["yellow"]);
        }
        if (this.fire != -1) {
            drawFire(this.x, this.fire);
        }
    }
    logic() {
        if (this.floorConstruction && t - this.floorConstruction.start > this.floorConstruction.duration) {
            this.floorConstruction = undefined;
            this.floors += 1;
        }
    }
    addFloor() {
        if (this.floors != this.floorCap) {
            this.floorConstruction = {start: t, duration: 240};
        }
    }
}
class School {
    constructor(x) {
        this.type = "school";
        this.x = x;
        this.width = 3;
        this.palette = [randomColor(), "lightBlue", randomColor(), randomColor(), randomColor()]
    }
    setup() {}
    draw() {
        drawModel(models.school, this.x * gridSize, streetY, scale, this.palette);
    }
    logic() {}
}
class FireStation {
    constructor(x) {
        this.type = "firestation";
        this.vehicles = [];
        this.x = x;
        this.width = 3;
        this.palette = ["red", "lightBlue", "white", "lightGray"];
    }
    setup() {
        for (let i = 0; i < 2; i++) {
            const firetruck = new Firetruck(this.x + i, true);
            this.vehicles.push(firetruck);
            vehicles.push(firetruck);
        }
        const firehelicopter = new FireHelicopter(this.x, 7 / 8, true);
        this.vehicles.push(firehelicopter);
        vehicles.push(firehelicopter);
    }
    draw() {
        drawModel(models.fireStation, this.x * gridSize, streetY, scale, this.palette);
    }
    logic() {}
}
class Shop {
    constructor(x) {
        this.type = "shop";
        this.signText = getWord(pluralNouns, word => word.length <= 8);
        ctx.font = `${Math.round(gridSize * 3 / 8 * 0.8)}px Arial`;
        const textMetrics = ctx.measureText(this.signText);
        this.signWidth = textMetrics.width / gridSize + 1 / 8;
        this.signTextOffset = (3 / 8 * gridSize - textMetrics.actualBoundingBoxAscent) / 2 / gridSize;
        this.x = x;
        this.width = 2;
        this.truck;
        this.truckArrived;
        this.palette = [randomColor(), "lightBlue", randomColor()];
    }
    setup() {
        this.truck = new Truck(this.x);
        this.truck.palette[2] = this.palette[0];
        this.truck.palette[3] = this.palette[2];
        vehicles.push(this.truck);
        this.truckArrived = t;
    }
    draw() {
        drawModel(models.shop, this.x * gridSize, streetY, scale, this.palette);
        ctx.fillStyle = this.palette[2];
        ctx.fillRect((this.x + 1) * gridSize + xOffset - this.signWidth * gridSize / 2, streetY - gridSize / 2, this.signWidth * gridSize,  -3 / 8 * gridSize);
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.font = `${Math.round(gridSize * 3 / 8 * 0.8)}px Arial`;
        ctx.fillText(this.signText, (this.x + 1) * gridSize + xOffset, streetY - gridSize / 2 - this.signTextOffset * gridSize);
    }
    logic() {
        if (this.truckArrived == undefined && this.truck.inBuilding) {
            this.truckArrived = t;
        }
        if (this.truckArrived && this.truckArrived + 120 < t) {
            this.truck.setDest(randInt(...borders), () => {});
            this.truckArrived = undefined;
        }
    }
}
class Empty {
    constructor() {}
    setup() {}
    draw() {}
    logic() {}
}
class Construction {
    constructor(duration, goal, x) {
        this.type = "construction";
        this.start = t;
        this.duration = duration;
        this.goal = goal;
        this.x = x;
    }
    draw() {
        drawModel(models.construction, this.x * gridSize, streetY, scale, ["yellow"]);
    }
    logic() {}
}
class Vehicle {
    constructor(x, y, maxV, type, model, palette, width, inBuilding, visibleWhenInside) {
        this.x = x;
        this.y = y;
        this.v = [0, 0];
        this.maxV = maxV;
        this.type = type;
        this.model = model;
        this.palette = palette;
        this.width = width;
        this.inBuilding = inBuilding;
        this.visibleWhenInside = visibleWhenInside;
        this.home = [x, y];
        this.tasks = [];
    }
    draw() {
        if (this.inBuilding == false || this.visibleWhenInside) {
            drawModel(this.model, this.x * gridSize, streetY - this.y * gridSize, scale, this.palette, Math.sign(this.v[0]) == -1, this.width);
        }
    }
    logic() {
        if (this.tasks.length != 0) {
            const task = this.tasks[0];
            this.setV(task.x, task.y);
            const arrivesX = this.arrivesInNextStepX(task.x);
            const arrivesY = this.arrivesInNextStepY(task.y);
            if (arrivesX) {
                this.v[0] = 0;
                this.x = task.x;
            }
            if (arrivesY) {
                this.v[1] = 0;
                this.y = task.y;
            }
            if (arrivesX && arrivesY) {
                if (task.callback) task.callback(task.x);
                this.tasks.splice(0, 1);
            } else {
                this.step();
            }
        } else if (this.inBuilding == false) {
            this.setV(...this.home);
            const arrivesX = this.arrivesInNextStepX(this.home[0]);
            const arrivesY = this.arrivesInNextStepY(this.home[1]);
            if (arrivesX) {
                this.v[0] = 0;
                this.x = this.home[0];
            }
            if (arrivesY) {
                this.v[1] = 0;
                this.y = this.home[1];
            }
            if (arrivesX && arrivesY) {
                this.inBuilding = true;
            } else {
                this.step();
            }
        }
    }
    setV(x, y) {
        this.v = [
            Math.sign(x - this.x) * this.maxV[0],
            Math.sign(y - this.y) * this.maxV[1]
        ];
    }
    step() {
        this.x += this.v[0] * dt;
        this.y += this.v[1] * dt;
    }
    arrivesInNextStepX(x) {
        return (this.x < x && this.x + this.v[0] * dt > x) || (this.x > x && this.x + this.v[0] * dt < x) || (this.x == x);
    }
    arrivesInNextStepY(y) {
        return (this.y < y && this.y + this.v[1] * dt > y) || (this.y > y && this.y + this.v[1] * dt < y) || (this.y == y);
    }
    setDest(pos, callback=undefined) {
        this.inBuilding = false;
        if (Array.isArray(pos)) {
            this.tasks.push({x: pos[0], y: pos[1], callback});
        } else {
            this.tasks.push({x: pos, y: this.y, callback});
        }
    }
}
class Car extends Vehicle {
    constructor(x, inBuilding) {
        super(x, -roadY, [2 / 60, 0], "car", models.car, [randomColor(), "lightBlue", "black"], 4, inBuilding, false);
    }
}
class Truck extends Vehicle {
    constructor(x) {
        super(x, -roadY, [2 / 60, 0], "truck", models.truck, ["black", "lightBlue", randomColor(), randomColor()], 10, false, true);
    }
}
class Firetruck extends Vehicle {
    constructor(x, inBuilding) {
        super(x, -roadY, [2 / 60, 0], "firetruck", models.firetruck, ["red", "lightBlue", "black", "lightGray", "yellow"], 8, inBuilding, false);
    }
}
class FireHelicopter extends Vehicle {
    constructor(x, y, inBuilding) {
        super(x, y, [2 / 60, 1 / 60], "firehelicopter", models.helicopter, ["black", "lightBlue", "red"], 9, inBuilding, true);
    }
}
function getIndexByType(arr, type, random=false) {
    const indexes = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].type == type) {
            if (!random) return i;
            indexes.push(i);
        }
    }
    if (indexes.length) {
        return indexes[Math.floor(Math.random() * indexes.length)];
    } else {
        return -1;
    }
}
function drawModel(model, x, y, scale, palette, mirrored=false, width=undefined) {
    model.forEach(rect => {
        ctx.fillStyle = (palette[rect[0]] instanceof Function ? palette[rect[0]]() : palette[rect[0]]);
        if (mirrored) {
            ctx.fillRect(x + (width - rect[1]) * scale + xOffset, y + rect[2] * scale, -rect[3] * scale, rect[4] * scale);
        } else {
            ctx.fillRect(x + rect[1] * scale + xOffset, y + rect[2] * scale, rect[3] * scale, rect[4] * scale);
        }
    });
}
function drawFire(x, y) {
    const colors = ["red", "orange", "yellow"];
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.lineTo((x + Math.random()) * gridSize + xOffset, streetY - (y + Math.random()) * gridSize);
        ctx.lineTo(x * gridSize + xOffset, streetY - y * gridSize);
        ctx.lineTo((x + 1) * gridSize + xOffset, streetY - y * gridSize);
        ctx.fill();
    }
}
function randomColor() {
    return `rgb(${randInt(255)}, ${randInt(255)}, ${randInt(255)})`;
}
function chance(c, n=1) {
    return Math.random() < (1 - (1 - c)**n);
}
function randInt(a, b=undefined) {
    if (b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    } else {
        return Math.floor(Math.random() * (a + 1));
    }
}
function randomBuilding() {
    const arr = [new School(0), new FireStation(0), new Shop(0)];
    const n = randInt(arr.length - 1);
    return arr[n];
}
function setScale(newScale) {
    scale = newScale;
    gridSize = 8 * newScale;
}
function setFire(pos=undefined) {
    let spot;
    if (Array.isArray(pos)) {
        if (city[pos[0] + arrayOffset].type == "flat" && city[pos[0] + arrayOffset].floors >= pos[1]) {
            spot = pos[0] + arrayOffset;
        } else {
            return 1;
        }
    } else {
        spot = getIndexByType(city, "flat", true);
    }
    if (spot != -1 && city[spot].fire == -1) {
        const fireHeight = pos ? pos[1] : randInt(city[spot].floors - 1);
        const extinguisher = getIndexByType(vehicles, fireHeight == 0 ? "firetruck" : "firehelicopter", true);
        if (extinguisher != -1) {
            const firePos = city[spot].x;
            city[spot].fire = fireHeight;
            vehicles[extinguisher].setDest([firePos, fireHeight == 0 ? -roadY : fireHeight], x => city[x + arrayOffset].fire = -1);        
        }
    }
}
function expand() {
    if (chance(options.newBuilding)) {
        const spot = randInt(0, 1);
        const object = (chance(options.specialBuilding) ? randomBuilding() : new Flat(0));
        const x = (spot ? borders[spot] : borders[spot] - object.width + 1);
        object.x = x;
        if (spot) { // right expansion
            borders[1] += object.width;
            for (let i = 1; i < object.width; i++) {
                city.push(new Construction(240, new Empty(), x + i));
            }
            city.push(new Construction(240, object, x));
        } else { // left expansion
            borders[0] -= object.width;
            arrayOffset += object.width;
            city.unshift(new Construction(240, object, x));
            for (let i = 1; i < object.width; i++) {
                city.unshift(new Construction(240, new Empty(), x + i));
            }
        }
    } else {
        const spot = getIndexByType(city, "flat", true);
        if (spot != -1 && !city[spot].floorConstruction) {
            city[spot].addFloor();
        }
    }
}
function logic() {
    if (chance(options.expansionChance, dt)) {
        expand();
    }
    if (chance(options.fireChance, dt * counts.flats)) {
        setFire();
    }
    city.forEach(object => object.logic());
    vehicles.forEach(object => object.logic());
    for (let i = 0; i < city.length; i++) {
        const object = city[i];
        if (object.type == "construction" && t - object.start > object.duration) {
            if (object.goal) {
                city[i] = object.goal;
                if (object.goal) object.goal.setup();
            } else {
                city.splice(i, 1);
                i--;
            }
        }
    }
    if (following) {
        xOffset = 400 - following.x * gridSize;
    }
    t += dt;
}
function draw() {
    ctx.fillStyle = "skyblue";
    ctx.fillRect(0, 0, canvas.width, streetY);
    ground.forEach(layer => {
        ctx.fillStyle = layer[0];
        ctx.fillRect(0, streetY + gridSize * layer[1], canvas.width, layer[2] * gridSize || canvas.height - gridSize * layer[1]);
    })
    city.forEach(object => object.draw());
    vehicles.forEach(object => object.draw());
}
function loop() {
    logic();
    draw();
    requestAnimationFrame(loop);
}
window.addEventListener("keypress", event => {
    if (event.code == "KeyA") {
        xOffset -= 10;
    } else if (event.code == "KeyD") {
        xOffset += 10;
    } else if (event.code == "KeyW") {
        streetY -= 10;
    } else if (event.code == "KeyS") {
        streetY += 10;
    } else if (!Number.isNaN(event.key)) {
        xOffset = ((borders[1] - borders[0]) * (1 - event.key / 9) + borders[0]) * gridSize + canvas.width / 2;
    }
});
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let streetY = 500;
let roadY = 0.35;
let ground = [
    ["lightGray", 0, 3 / 16],
    ["darkGray", 3 / 16, 5 / 8],
    ["green", 13 / 16]
];
let following = undefined;
let scale = 10;
let gridSize = 8 * scale;
const options = {
    newBuilding: 1 / 4,
    expansionChance: 1 / 60,
    fireChance: 1 / 10000,
    specialBuilding: 1 / 6
}
const counts = {
    flats: 0
}
let xOffset = 400;
let arrayOffset = 0;
let borders = [-1, 4];
let t = 0;
let dt = 1;
const vehicles = [];
const city = [
    new Flat(0), new FireStation(1), new Empty(), new Empty()
];
city[1].setup();
loop();
// TODO: hospital, police station, church, theater
