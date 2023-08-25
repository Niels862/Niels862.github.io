class Wireframe {
    constructor(triangles) {
        this.triangles = triangles;
    }
    draw(ctx, rotation, viewBox) {
        this.triangles.forEach(triangle => triangle.draw(ctx, rotation, viewBox));
    }
}
class Triangle {
    constructor(points) {
        this.points = points;
    }
    split() {
        let newPoints = [];
        for (let i = 0; i < 3; i++) {
            let a = this.points[i];
            let b = this.points[(i + 1) % 3];
            let c = [ // point between a and b
                (a.x + b.x) / 2, 
                (a.y + b.y) / 2, 
                (a.z + b.z) / 2
            ];
            let d = (c[0]**2 + c[1]**2 + c[2]**2)**0.5;
            newPoints.push(new Point(c[0] / d, c[1] / d, c[2] / d));
        }
        for (let i = 0; i < 3; i++) {
            wireframe.triangles.push(new Triangle([this.points[(i + 1) % 3], newPoints[i], newPoints[(i + 1) % 3]]));
        }
        this.points = [...newPoints];
    }
    draw(ctx, rotation, viewBox) {
        ctx.beginPath();
        for (let i = 0; i <= 3; i++) {
            const rotPoint = this.points[i % 3].rotate(rotation);
            ctx.lineTo(...translatePoint([rotPoint.x, rotPoint.y], viewBox, [0, 0, 800, 800]));
        }
        ctx.stroke();
    }
}
class Point {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    rotate(rotation) {
        const rotPoint = new Point(this.x, this.y, this.z);
        let d = Math.hypot(rotPoint.y, rotPoint.x);
        let angle = Math.atan2(rotPoint.y, rotPoint.x) + rotation[2];
        rotPoint.x = d * Math.cos(angle);
        rotPoint.y = d * Math.sin(angle);
        d = Math.hypot(rotPoint.y, rotPoint.z);
        angle = Math.atan2(rotPoint.y, rotPoint.z) + rotation[0];
        rotPoint.z = d * Math.cos(angle);
        rotPoint.y = d * Math.sin(angle);
        d = Math.hypot(rotPoint.x, rotPoint.z);
        angle = Math.atan2(rotPoint.x, rotPoint.z) + rotation[1];
        rotPoint.z = d * Math.cos(angle);
        rotPoint.x = d * Math.sin(angle);
        return rotPoint;
    }
}
function translatePoint(point, box1, box2) {
    return [
        (point[0] - box1[0]) / (box1[2] - box1[0]) * (box2[2] - box2[0]) + box2[0],
        (point[1] - box1[1]) / (box1[3] - box1[1]) * (box2[3] - box2[1]) + box2[1]
    ]
}
function smoothen() {
    let n = wireframe.triangles.length;
    for (let i = 0; i < n; i++) {
        wireframe.triangles[i].split();
    }
}
function draw() {
    ctx.clearRect(0, 0, 800, 800);
    wireframe.draw(ctx, rotation, [-2, -2, 2, 2]);
    for (let i = 0; i < 3; i++) {
        rotation[i] += rotationD[i];
    }
    requestAnimationFrame(draw);
}
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
    smoothen();
})
let rotation = [0, 0, 0];
let rotationD = [2 * Math.PI / 360, 2 * Math.PI / 360, 2 * Math.PI / 360];
let points = [
    new Point(-1, 0, 0),
    new Point(1, 0, 0),
    new Point(0, -1, 0),
    new Point(0, 1, 0),
    new Point(0, 0, -1),
    new Point(0, 0, 1)
]
let wireframe = new Wireframe([
    new Triangle([points[5], points[2], points[1]]),
    new Triangle([points[1], points[2], points[4]]),
    new Triangle([points[4], points[2], points[0]]),
    new Triangle([points[0], points[2], points[5]]),
    new Triangle([points[5], points[3], points[1]]),
    new Triangle([points[1], points[3], points[4]]),
    new Triangle([points[4], points[3], points[0]]),
    new Triangle([points[0], points[3], points[5]])
])
draw();