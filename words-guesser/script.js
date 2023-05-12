class Game {
    constructor(stages) {
        this.data;
        this.words = {
            used: [],
            unused: []
        };
        this.wordsList = document.getElementById("words-list");
        this.setup = false;
        this.time = 2500;
        this.timeBar = new ProgressBar(
            document.getElementById("time-bar")
        );
        this.stages = stages;

        fetch("words.json")
            .then(response => response.json())
            .then(json => {
                this.data = json;
                onDataResolution(json);
            })
            .catch(error => alert(`Error: ${error}`));
    }

    activate() {
        if (!this.setup) {
            this.loadWords();
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
});
