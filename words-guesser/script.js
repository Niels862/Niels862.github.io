class Game {
    constructor(stages) {
        this.data;
        this.words = {
            used: [],
            unused: []
        };
        this.wordsList = document.getElementById("words-list");
        this.teamsList = new List(
            document.getElementById("teams-list"), Team
        );
        this.teamEditName = document.getElementById("team-edit-name");
        this.teamEditMembers = document.getElementById("team-edit-members");
        this.teams = [];
        this.ready = false;
        this.time = 2500;
        this.timeBar = new ProgressBar(
            document.getElementById("time-bar")
        );
        this.stages = stages;
        this.teamsList.add(2);
        this.teamsList.setup();

        fetch("words.json")
            .then(response => response.json())
            .then(json => {
                this.data = json;
                onDataResolution(json);
            })
            .catch(error => alert(`Error: ${error}`));
    }

    activate() {
        if (!this.ready) {
            this.loadWords();
            this.ready = true;
        }

        this.timeBar.start(this.time, () => this.deactivate());

        this.wordsList.innerHTML = "";
        for (let i = 0; i < 5; i++) {
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

    deactivate() {
        this.stages["prepare"].show();
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
    constructor(canvas, color="rebeccapurple") {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.fillStyle = color;
        this.startTime = 0;
        this.time = 0;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    start(time, onFinish) {
        this.startTime = Date.now();
        this.time = time;
        this.onFinish = onFinish;
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
    constructor(container, entryClass) {
        this.container = container;
        this.entryClass = entryClass;
        this.array = [];
    }

    setup() {
        this.container.innerHTML = "";
        this.array.forEach(entry => {
            this.appendEntry(entry);
        });        
    }

    removeEntry(entry) {
        console.log(entry, "removed");
    }

    appendEntry(entry) {
        const elem = document.createElement("div");
        const name = document.createElement("div");
        const remove = document.createElement("button");
        name.innerHTML = entry.name;
        remove.innerHTML = "X";
        remove.classList.add("button-small");
        remove.addEventListener("click", event => {
            event.stopPropagation();
            this.removeEntry(entry);
            event.target.parentElement.remove();
        });
        elem.append(name, remove);
        this.container.append(elem);
    }

    add(n) {
        for (let i = 0; i < n; i++) {
            const entry = new this.entryClass();
            this.array.push(entry);
            this.appendEntry(entry);
        }
    }
}

class Stage {
    constructor(container) {
        this.container = container;
    }

    show() {
        for (const elem of document.getElementsByClassName("shown")) {
            elem.classList.remove("shown");
        }
        this.container.classList.add("shown");
    }
}

class Team {
    constructor(element, name) {
        this.name = "test";
        this.members = [];
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
                elem.checked = true;
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

    document.getElementById("activate").addEventListener("click", () => {
        stages["active"].show();
        game.activate();
    });

    document.getElementById("teams-add").addEventListener("click", () => {
        game.addTeam();
    })
});
