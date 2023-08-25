class Ball {
    constructor(x, y, d) {
        this.x = x;
        this.y = y;
        this.d = d;
    }
    step() {
        this.x += stepSize * Math.cos(this.d);
        this.y += stepSize * Math.sin(this.d);
        walls.forEach(wall => {
            let collision = wall.collision(this.x, this.y);
            if (collision != -1) {
                this.d = -this.d + 2 * collision;
            }
        })
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, ballRadius, 0, 2 * Math.PI);
        ctx.fill();
    }
}
class Wall {
    constructor(start, end) {
        this.start = start;
        this.end = end;
        this.isHorizontal = start[1] == end[1];
        this.isVertical = start[0] == end[0];
        this.d = Math.atan2(end[1] - start[1], end[0] - start[0]);
        this.length = Math.hypot(end[1] - start[1], end[0] - start[0]);
        this.box = [
            [min(start[0], end[0]), min(start[1], end[1])],
            [max(start[0], end[0]), max(start[1], end[1])]
        ]; // [topleft, bottomright]
    }
    collision(x, y) {
        let isCollision;
        if (this.isHorizontal) {
            isCollision = Math.abs(this.start[1] - y) <= ballRadius && this.box[0][0] <= x && this.box[1][0] >= x;
        } else if (this.isVertical) {
            isCollision = Math.abs(this.start[0] - x) <= ballRadius && this.box[0][1] <= y && this.box[1][1] >= y;
        } else {
            let AC = Math.hypot(this.start[1] - y, this.start[0] - x);
            let dBAC = this.d - Math.atan2(y - this.start[1], x - this.start[0]);
            let DC = Math.abs(AC * Math.sin(dBAC));
            let AD = AC * Math.sin(0.5 * Math.PI - dBAC);
            isCollision = DC < ballRadius && AD >= 0 && AD <= this.length;
        }
        return isCollision ? this.d : -1;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(...this.start);
        ctx.lineTo(...this.end);
        ctx.stroke();
    }
}
class roundWall {
    constructor(center, rx, ry) {
        this.center = center;
        this.rx = rx;
        this.ry = ry;
    }
    collision(x, y) {
        let distanceFromCenter = Math.hypot((y - this.center[1]) * (this.rx / this.ry), x - this.center[0]);
        if (distanceFromCenter < this.rx + 0.5 * ballRadius && distanceFromCenter > this.rx - 0.5 * ballRadius) {
            return Math.atan2(y - this.center[1], x - this.center[0]) + 0.5 * Math.PI;
        } else {
            return -1;
        }
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.ellipse(...this.center, this.rx, this.ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
    }
}
function wallPolygon(pointsList) {
    for (let i = 0; i < pointsList.length; i++) {
        walls.push(new Wall([...pointsList[i]], [...pointsList[(i + 1) % pointsList.length]]));
        walls.push(new roundWall([...pointsList[i]], 1, 1));
    }
}
const min = (a, b) => a <= b ? a : b;
const max = (a, b) => a >= b ? a : b;
function reset(ballsAmount) {
    balls.length = 0;
    for (let i = 0; i < ballsAmount; i++) {
        balls.push(new Ball(400, 400, (i / ballsAmount) * 2 * Math.PI));
    }
}
function logic() {
    balls.forEach(ball => ball.step())
}
function draw() {
    ctx.clearRect(0, 0, 800, 800);
    walls.forEach(wall => wall.draw(ctx));
    balls.forEach(ball => ball.draw(ctx));
}
function loop() {
    if (!paused) {
        for (let i = 0; i < stepsInFrame; i++) {
            logic();
        }
    }
    draw();
    requestAnimationFrame(loop);
}
window.addEventListener("keydown", event => {
    if (event.code == "Space") {
        paused = (paused ? false : true);
    }
})
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const balls = [];
const walls = [
    new Wall([0, 0], [799, 0]),
    new Wall([0, 799], [799, 799]),
    new Wall([0, 0], [0, 799]),
    new Wall([799, 0], [799, 799])
];
let stepSize = 0.1;
let ballRadius = 5;
let stepsInFrame = 20;
let paused = true;
let selection = [];
reset(360);
loop();
