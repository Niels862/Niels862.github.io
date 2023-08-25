function loop(lastPoint=undefined) {

    const newPoint = [400, 400];
    const points = [[...newPoint]];
    for (let i = 0; i < periods.length; i++) {
        let x = n * nMult / periods[i];
        newPoint[0] += amplitudes[i] * Math.cos(x);
        newPoint[1] += amplitudes[i] * Math.sin(x);
        points.push([...newPoint]);
    }
    
    if (lastPoint) {
        ctxBg.strokeStyle = "white";
        ctxBg.beginPath();
        ctxBg.moveTo(...lastPoint);
        ctxBg.lineTo(...newPoint);
        ctxBg.stroke();
    } else {
        ctxBg.fillStyle = "black";
        ctxBg.fillRect(0, 0, 800, 800);
    }

    ctxFg.clearRect(0, 0, 800, 800);
    ctxFg.strokeStyle = "white";
    ctxFg.beginPath();
    points.forEach(point => ctxFg.lineTo(...point));
    ctxFg.stroke();
    for (let i = 0; i < periods.length; i++) {
        ctxFg.beginPath();
        ctxFg.arc(...points[i], amplitudes[i], 0, 2 * Math.PI);
        ctxFg.stroke();
    }
    n++;
    requestAnimationFrame(() => loop([...newPoint]));
}

window.addEventListener("keypress", event => {
    if (event.code == "Space") {
        canvasFg.style.display = canvasFg.style.display == "block" ? "none" : "block";
    }
});

const canvasFg = document.getElementById("fg");
const canvasBg = document.getElementById("bg");
const ctxFg = canvasFg.getContext("2d");
const ctxBg = canvasBg.getContext("2d");
const periods = [0.25, 2];
const amplitudes = [100, 100];

let n = 0;
let nMult = 1;
loop();
