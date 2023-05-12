class Game {
    constructor() {
        let data;
        fetch("words.json")
            .then(response => response.json())
            .then(json => {
                data = json;
                for (const elem of document.getElementsByClassName("redirector")) {
                    elem.disabled = false;
                }
            })
            .catch(error => alert(`Error: ${error}`));
    }
}

class Stage {
    constructor(id) {
        this.container = document.getElementById(id);
    }

    show() {
        for (const elem of document.getElementsByClassName("shown")) {
            elem.classList.remove("shown");
        }
        this.container.classList.add("shown");
    }
}

addEventListener("DOMContentLoaded", () => {
    const stages = {
        index: new Stage("index"),
        prepare: new Stage("prepare"),
        active: new Stage("active")
    }
    
    const game = new Game();

    for (const elem of document.getElementsByClassName("redirector")) {
        elem.addEventListener("click", event => {
            stages[event.target.dataset.redirect].show();
        });
    }
});
