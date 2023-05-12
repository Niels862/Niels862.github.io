class Game {
    constructor() {
        let categories;
        let words = {
            used: [],
            unused: []
        };
        fetch("words.json")
            .then(response => response.json())
            .then(json => {
                categories = json;
                onDataResolution(json);
            })
            .catch(error => alert(`Error: ${error}`));
    }

    // loads words from chosen categories into words
    loadWords() {

    }

    randomWord() {
        if (words.unused.length > 0) {
            const word = this.words.unused.pop();
            this.words.used.push(word);
            return word;
        }
        words.unused = words.used;
        words.used = [];
        return this.randomWord();
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
    for (let i = 0; i < arr.length - 1; i--) {
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
                htmlFor: id, innerText: name
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
    
    const game = new Game();

    for (const elem of document.getElementsByClassName("stage-container")) {
        stages[elem.id] = new Stage(elem);
    }

    for (const elem of document.getElementsByClassName("redirector")) {
        elem.addEventListener("click", event => {
            stages[event.target.dataset.redirect].show();
        });
    }
});
