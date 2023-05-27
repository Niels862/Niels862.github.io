class Game {
    constructor(stages) {
        this.data;
        this.words = {
            used: [],
            unused: []
        };
        this.wordsList = document.getElementById("words-list");
        this.timeInput = document.getElementById("time-input");
        this.nWordsInput = document.getElementById("n-words-input");
        this.ready = false;
        this.nWords;
        this.timeBar = new ProgressBar(
            document.getElementById("time-bar"), 0,
            () => {
                this.doneButton.classList.add("shown");
            }
        );
        this.stages = stages;
        this.teamManager = new TeamManager(this);
        this.doneButton = document.getElementById("done");
        fetch("words.json")
            .then(response => response.json())
            .then(json => {
                this.data = json;
                onDataResolution(json);
            })
            .catch(error => alert(`Error: ${error}`));
    }

    prepare() {
        for (const elem of this.wordsList.children) {
            if (elem.classList.contains("word-checkbox") && elem.checked) {
                this.teamManager.team.score++;
            }
        }
        this.teamManager.nextPlayer();
        this.teamManager.setPrepare();
    }

    activate() {
        if (!this.ready) {
            this.loadWords();
            this.timeBar.time = 1000 * this.timeInput.value;
            this.nWords = this.nWordsInput.value;
            this.ready = true;
        }

        this.timeBar.start();

        this.doneButton.classList.remove("shown");
        this.wordsList.innerHTML = "";
        for (let i = 0; i < this.nWords; i++) {
            const word = this.randomWord();
            const id = `word-${i}`;
            this.wordsList.append(
                newElement("input", {
                    type: "checkbox", id, 
                }, elem => {
                    elem.classList.add("checkbox", "word-checkbox");
                }),
                newElement("label", {
                    htmlFor: id, innerText: word
                }, elem => elem.classList.add("checkbox-label"))
            );
        }
    }

    loadWords() {
        for (const elem of document.getElementsByClassName("category-checkbox")) {
            if (elem.checked) {
                this.words.used = this.words.used.concat(
                    this.data.categories[elem.dataset.index].words
                );
            }
        }
    }

    randomWord() {
        if (this.words.unused.length > 0) {
            const word = this.words.unused.pop();
            this.words.used.push(word);
            return word;
        }
        this.words.unused = this.words.used;
        shuffle(this.words.unused);
        this.words.used = [];
        return this.randomWord();
    }
}

class ProgressBar {
    constructor(canvas, time, onFinish, color="rebeccapurple") {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.fillStyle = color;
        this.time = time;
        this.onFinish = onFinish;
        this.width = canvas.width;
        this.height = canvas.height;
        this.startTime = 0;

        canvas.addEventListener("dblclick", () => {
            this.startTime = Date.now() - this.time;
        })
    }

    start(time, onFinish) {
        this.startTime = Date.now();
        this.draw();
    }

    draw() {
        const t = Date.now();
        const p = (t - this.startTime) / this.time;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillRect(0, 0, p * this.width, this.height);
        if (t < this.startTime + this.time) {
            requestAnimationFrame(() => this.draw());
        } else {
            this.onFinish();
        }
    }
}

// creates a list from user input
// entry should have properties 'name' and 'id' and methods 'create' and 'delete'
class List {
    constructor(container, addButton, constructorCallback, addButtonCallback, entryButtonCallback, isEditable) {
        this.container = container;
        this.constructorCallback = constructorCallback;
        this.entryButtonCallback = entryButtonCallback;
        this.isEditable = isEditable;
        this.array = [];
        this.idCounter = 1;
        addButton.addEventListener("click", () => {
            this.add(1);
            addButtonCallback(this.last);
        });
    }

    get first() {
        return this.array[0];
    }

    get last() {
        return this.array[this.array.length - 1];
    }

    setup() {
        this.container.innerHTML = "";
        this.array.forEach(entry => {
            this.appendEntry(entry);
        });
    }

    removeEntry(entry) {
        this.array.splice(this.array.indexOf(entry), 1);
    }

    appendEntry(entry) {
        const elem = document.createElement("div");
        let name;
        if (this.isEditable) {
            name = document.createElement("input");
            name.type = "text";
            name.value = entry.name;
        } else {
            name = document.createElement("div");
            name.innerHTML = entry.name;
        }
        const remove = document.createElement("button");
        remove.innerHTML = "&#215;";
        remove.classList.add("button-small");
        remove.addEventListener("click", event => {
            event.stopPropagation();
            this.removeEntry(entry);
            event.target.parentElement.remove();
        });
        elem.append(name, remove);
        elem.addEventListener(this.isEditable ? "input" : "click", event => {
            this.entryButtonCallback(event, entry);
        })
        this.container.append(elem);
    }

    add(n) {
        for (let i = 0; i < n; i++) {
            const entry = this.constructorCallback(this.idCounter);
            this.array.push(entry);
            this.appendEntry(entry);
            this.idCounter++;
        }
    }
}

class Stage {
    constructor(container) {
        this.container = container;
        this.callback = undefined;
    }

    show() {
        for (const elem of document.getElementsByClassName("shown")) {
            elem.classList.remove("shown");
        }
        this.container.classList.add("shown");
        if (this.callback) {
            this.callback();
        }
    }
}

class TeamManager {
    constructor(game) {
        this.game = game;
        this.membersList = new List(
            document.getElementById("members-list"),
            document.getElementById("members-add"),
            id => new Member(id),
            member => {},
            (event, member) => member.name = event.target.value,
            true
        );
        this.teamsList = new List(
            document.getElementById("teams-list"), 
            document.getElementById("teams-add"),
            id => new Team(id, game, this.membersList),
            team => this.showTeamSetup(team),
            (event, team) => this.showTeamSetup(team),
            false
        );
        this.scoreDisplay = document.getElementById("score-display");
        this.turnDisplay = document.getElementById("turn-display");
        this.teamsList.add(2);
        this.teamsList.setup();
        this.shownInSetup = undefined;
        document.getElementById("team-edit-name").addEventListener("input", event => {
            this.shownInSetup.name = event.target.value;
            this.teamsList.setup(); // TODO: maybe make better
        });
        this.turn = -1;
    }

    get nTeams() {
        return this.teamsList.array.length;
    }

    get team() {
        return this.teamsList.array[this.turn];
    }

    get prevTeam() {
        return this.teamsList.array[(this.turn + this.nTeams - 1) % this.nTeams];
    }

    showTeamSetup(team) {
        this.shownInSetup = team;
        team.showSetup();
        this.game.stages["setup-team-edit"].show();
    }

    nextPlayer() {
        this.turn = (this.turn + 1) % this.teamsList.array.length;
        this.teamsList.array[this.turn].nextPlayer();
    }

    setPrepare() {
        const team = this.teamsList.array[this.turn];
        const member = team?.members[team.turn];
        let display = "";
        if (team) {
            display = team.name;
        }
        if (member) {
            display = `${member.name} (${team.name})`;
        }
        this.turnDisplay.innerText = display;
        this.scoreDisplay.innerHTML = "";
        this.teamsList.array.forEach(team => {
            const elem = document.createElement("div");
            elem.append(
                newElement("div", {"innerText": team.name}),
                newElement("div", {"innerText": team.score})
            );
            this.scoreDisplay.append(elem);
        });
    }
}

class Team {
    constructor(id, game, membersList) {
        this.name = `Team ${id}`;
        this.game = game;
        this.members = [];
        this.membersList = membersList;
        this.turn = -1;
        this.score = 0;
    }

    showSetup() {
        document.getElementById("team-edit-name").value = this.name;
        this.membersList.array = this.members;
        this.membersList.setup();
    }

    nextPlayer() {
        if (!this.members) {
            return undefined;
        }
        this.turn = (this.turn + 1) % this.members.length;
        return this.members[this.turn];
    }
}

class Member {
    constructor(id) {
        this.name = `Player ${id}`;
    }
}

function shuffle(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

function onDataResolution(json) {
    const categoriesList = document.getElementById("categories-list");
    
    for (const elem of document.getElementsByClassName("redirector")) {
        elem.disabled = false;
    }

    categoriesList.innerHTML = "";
    for (let i = 0; i < json.categories.length; i++) {
        const category = json.categories[i];
        const name = category.name;
        const id = `category-${name.toLowerCase()}`;
        categoriesList.append(
            newElement("input", {
                type: "checkbox", id, 
            }, elem => {
                elem.classList.add("checkbox", "category-checkbox");
                elem.checked = category.enabled;
                elem.dataset.index = i;
            }),
            newElement("label", {
                htmlFor: id, innerText: `${name} (${category.words.length})`
            }, elem => elem.classList.add("checkbox-label"))
        );

    }
}

function newElement(type, json, func=elem => {}) {
    const elem = document.createElement(type);
    for (key in json) {
        elem[key] = json[key];
    }
    func(elem);
    return elem;
}

addEventListener("DOMContentLoaded", () => {
    const stages = {};
    
    const game = new Game(stages);

    for (const elem of document.getElementsByClassName("stage-container")) {
        stages[elem.id] = new Stage(elem);
    }

    for (const elem of document.getElementsByClassName("redirector")) {
        elem.addEventListener("click", event => {
            stages[event.target.dataset.redirect].show();
        });
    }

    stages["prepare"].callback = () => game.prepare();
    stages["active"].callback = () => game.activate();
});
