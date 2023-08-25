function makeArray(length, value) {
    const arr = [];
    for (let i = 0; i < length; i++) {
        arr.push(value);
    }
    return arr;
}
function invertArray(arr) {
    const outArr = [];
    for (let i = 0; i < arr.length; i++) {
        outArr[i] = arr[arr.length - i - 1];
    }
    return outArr;
}
function retrieve(arr, x) {
    return (x >= 0 && x < arr.length) ? arr[x] : 0;
}
function binToDec(binArr) {
    let dec = 0;
    for (let i = 0; i < binArr.length; i++) {
        dec += 2**i * binArr[binArr.length - 1 - i];
    }
    return dec;
}
function decToBin(dec, arrLength) {
    let binArr = [];
    for (let i = 0; i < arrLength; i++) {
        const num = 2**(arrLength - i - 1);
        binArr[i] = (dec >= num) ? 1 : 0;
        dec -= (dec >= num) * num;
    }
    return binArr;
}
function drawRow(row, y, size) {
    for (let i = 0; i < row.length; i++) {
        ctx.fillStyle = colors[row[i]];
        ctx.fillRect(i * size, y, size, size);  
    }
}
function draw() {
    if (y < rowLength) {
        drawRow(row, (y++) * size, size);
        let newRow = [];
        for (let i = 0; i < row.length; i++) {
            newRow[i] = rules[binToDec([retrieve(row, i - 1), retrieve(row, i), retrieve(row, i + 1)])];
        }
        row = [...newRow];
    }
    requestAnimationFrame(draw);
}
function newDrawing(ruleNumber, initial, newSize=1) {
    console.log(initial);
    size = newSize;
    rowLength = Math.floor(800 / size);
    row = makeArray(rowLength, 0);
    initial.forEach(x => row[x] = 1);
    rules = invertArray(decToBin(ruleNumber, 8));
    y = 0;
    ctx.clearRect(0, 0, 800, 800);
}
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const button = document.getElementById("newDrawing");
const colors = ["white", "black"];
let rules, y, size, row, rowLength;
newDrawing(90, [399]);
draw();
button.addEventListener("click", () => 
    newDrawing(
        document.getElementById("ruleNumber").value, 
        (document.getElementById("initials").value || "").split(",").map(x => Number.parseInt(x))
    )
);
window.addEventListener("keypress", event => {
    if (event.which == 13) button.click();
});