function array2d(a, b, value=0) {
    let output = [];
    for (let i = 0; i < a; i++) {
        output.push([]);
        for (let j = 0; j < b; j++) {
            output[i].push(value);
        }
    }
    return output;
}
function logCoordinateArray(arr2d) {
    let out = [];
    for (let y = 0; y < height; y++) {
        let row = [];
        for (let x = 0; x < width; x++) {
            row.push(arr2d[x][y].toString());
        }
        out.push(row.join(" "));
    }
    console.log(out.join("\n"));
}
function valid(arr2d, x, y) {
    return x >= 0 && x < arr2d.length && y >= 0 && y < arr2d[0].length;
}
function getAdjacentValues(arr2d, x, y) {
    let output = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if ((i || j) && valid(arr2d, x + i, y + j)) {
                output.push(arr2d[x + i][y + j]);
            }
        }
    }
    return output;
}
function sum(arr) {
    let output = 0;
    arr.forEach(elem => output += elem);
    return output;
}
function gameOverAnimation(sourceX, sourceY, n) {
    if (running) {
        return;
    }
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const cell = getCell(x, y);
            const d = Math.hypot(y - sourceY, x - sourceX);
            if (d + 4 - n > 0 && d + 4 - n < 5) {
                cell.style.backgroundColor = ["white", "lightYellow", "yellow", "orange", "red"][Math.floor(d + 4 - n)];
                if (isMine[x][y]) {
                    cell.innerHTML = strings.mine;
                } else {
                    cell.innerHTML = "";
                }
            } else if (d + 4 - n < 0) {
                cell.style.backgroundColor = "#bbbbbb";
            }
        }
    }
    if (n < (width**2 + height**2)**0.5 + 5) {
        setTimeout(() => gameOverAnimation(sourceX, sourceY, n + 0.25), animationTimeout);
    }
}
function reset() {
    board.innerHTML = "";
    for (let y = 0; y < height; y++) {
        const tr = document.createElement("tr");
        for (let x = 0; x < width; x++) {
            const td = document.createElement("td");
            td.width = 40;
            td.height = 40;
            tr.appendChild(td);
        }
        board.appendChild(tr);
    }
    states = array2d(width, height);
    isMine = array2d(width, height);
    firstClick = true;
    running = true;
    uncoveredCells = 0;
    flagsPlaced = 0;
    startTime = undefined;
    let minesPlaced = 0;
    while (minesPlaced != mines) {
        let place = [Math.floor(Math.random() * width), Math.floor(Math.random() * height)];
        if (!isMine[place[0]][place[1]]) {
            isMine[place[0]][place[1]] = 1;
            minesPlaced++;
        }
    }
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            updateCell(x, y);
        }
    }
}
function getCell(x, y) {
    return board.childNodes[y].childNodes[x];
}
function updateCell(x, y, adjacentMines=0) {
    const cell = getCell(x, y);
    const state = states[x][y];
    if (state == 0) {
        cell.innerHTML = "";
        cell.style.backgroundColor = "#888888";
    } else if (state == 1) {
        if (isMine[x][y]) {
            cell.innerHTML = strings.mine;
        } else {
            cell.innerHTML = (adjacentMines ? adjacentMines.toString() : "");
        }
        cell.style.backgroundColor = "#bbbbbb";
    } else if (state == 2) {
        cell.innerHTML = strings.flag;
    }
}
function flag(x, y) {
    const state = states[x][y];
    if (running && state != 1) {
        if (states[x][y] == 0) {
            states[x][y] = 2;
            flagsPlaced++;
        } else {
            states[x][y] = 0;
            flagsPlaced--;
        }
        updateCell(x, y);
    }
}
function reveal(x, y) {
    const state = states[x][y];
    if (running && state == 0) {
        states[x][y] = 1;
        if (firstClick) {
            startTime = Date.now();
            if (isMine[x][y]) {
                isMine[x][y] = 0;
                place = [Math.floor(Math.random() * width), Math.floor(Math.random() * height)];
                do {
                    place = [Math.floor(Math.random() * width), Math.floor(Math.random() * height)];
                } while (isMine[place[0]][place[1]]);
                isMine[place[0]][place[1]] = 1;    
            }
            firstClick = false;
        } else if (isMine[x][y]) {
            updateCell(x, y);
            running = false;
            gameOverAnimation(x, y, 0);
            updateTimer("Game Over");
            return;
        }
        let adjacentMines = sum(getAdjacentValues(isMine, x, y));
        if (!adjacentMines) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if ((i || j) && valid(isMine, x + i, y + j) && !states[x + i][y + j]) {
                        reveal(x + i, y + j);
                    }
                }
            }
        }
        uncoveredCells++;
        if (uncoveredCells == width * height - mines) {
            let score = Date.now() - startTime;
            running = false;
            updateTimer("Succes!");
            if (!useAnalysis) {
                updateScoreboard(score); 
            }
        }
        updateCell(x, y, adjacentMines);
    }
}
function analyze(km=undefined, ks=undefined, uk=undefined) {
    let knownMines = km || array2d(width, height);
    let knownSafes = ks || array2d(width, height);
    let unknowns = uk || states.map(subArr => subArr.map(elem => elem == 1 ? 0 : 1));
    let changed = false;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (states[x][y] == 1) {
                let adjacentMines = sum(getAdjacentValues(isMine, x, y));
                let adjacentUnknown = sum(getAdjacentValues(unknowns, x, y));
                let adjacentKnownMines = sum(getAdjacentValues(knownMines, x, y));
                if (adjacentUnknown) {
                    for (let i = -1; i <= 1; i++) {
                        for (let j = -1; j <= 1; j++) {
                            if ((i || j) && valid(states, x + i, y + j) && unknowns[x + i][y + j]) {
                                if (adjacentMines - adjacentKnownMines == adjacentUnknown) {
                                    knownMines[x + i][y + j] = 1;
                                    unknowns[x + i][y + j] = 0;
                                    getCell(x + i, y + j).innerHTML = "X";
                                    changed = true;
                                } else if (adjacentMines == adjacentKnownMines) {
                                    knownSafes[x + i][y + j] = 1;
                                    unknowns[x + i][y + j] = 0;
                                    getCell(x + i, y + j).innerHTML = "S";
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    if (changed) {
        analyze(knownMines, knownSafes, unknowns);
    }
    return {knownMines, knownSafes, unknowns};
}
function updateTimer(msg="") {
    timer.innerHTML = `${(Date.now() - startTime) / 1000}s<br>(${flagsPlaced}/${mines}) ${msg}`;
}
function updateScoreboard(newScore=undefined) {
    const gameID = `HS${width}x${height}:${mines}`;
    let scores;
    if (localStorage.getItem(gameID)) {
        scores = eval("[" + localStorage.getItem(gameID) + "]");
    } else {
        scores = [];
    }
    if (newScore) {
        scores.push(newScore);
        scores.sort();
        localStorage.setItem(gameID, scores.toString());
    }
    highScoreTable.innerHTML = "";
    for (let i = 0; i < (scores.length > 5 ? 5 : scores.length); i++) {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        td1.innerHTML = (i + 1).toString();
        tr.appendChild(td1);
        const td2 = document.createElement("td");
        td2.innerHTML = (scores[i] / 1000).toString();
        tr.appendChild(td2);
        if (scores[i] == newScore && !(i > 0 && scores[i - 1] == newScore)) {
            tr.style.backgroundColor = "lightBlue";
        }
        highScoreTable.appendChild(tr);
    }
}
function timerLoop() {
    if (startTime && running) {
        updateTimer();
    }
    requestAnimationFrame(timerLoop);
}
const board = document.getElementById("board");
board.addEventListener('contextmenu', event => {
    event.preventDefault();
    flag(event.target.cellIndex, event.target.parentNode.rowIndex)
});
board.addEventListener("click", event => {
    reveal(event.target.cellIndex, event.target.parentNode.rowIndex)
    if (useAnalysis) {
        analyze();
    }
});
const timer = document.getElementById("timer");
const highScoreTable = document.getElementById("highScoreTable")
const strings = {
    mine: "&#128165;",
    flag: "&#128681;"
}
let states, isMine, firstClick, startTime, running, uncoveredCells, flagsPlaced;
let width = 10;
let height = 10;
let mines = 10;
let animationTimeout = 20;
let useAnalysis = false;
reset();
timerLoop();
updateScoreboard();
