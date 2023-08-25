class Component {
    constructor(x, y, inPortsN, outPortsN, width, height) {
        this.x = x;
        this.y = y;
        this.ports = [inPortsN, outPortsN];
        this.wires = [[], []];
        this.width = width;
        this.height = height;
        this.id = idCounter++;
    }
    draw(ctx) {
        this.drawGlobal(ctx);
        if (this.drawComponent) this.drawComponent(ctx);
    }
    drawGlobal(ctx) {
        ctx.fillStyle = "lightGray";
        if (selectedComponent && this.id == selectedComponent.id) {
            ctx.strokeStyle = "blue";
        } else {
            ctx.strokeStyle = "black";
        }
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.beginPath();
        for (let i = 0; i < 2; i++) {
            const n = this.ports[i];
            const d = i ? 1 : -1;
            for (let j = 0; j < n; j++) {
                const portPos = this.getPortPos(i, j);
                ctx.moveTo(portPos[0] - 30 * d, portPos[1]);
                ctx.lineTo(...portPos);
                ctx.moveTo(portPos[0] + portSize, portPos[1]);
                ctx.arc(...portPos, portSize, 0, 2 * Math.PI);
            }
        }
        ctx.stroke();
    }
    delete() {
        for (let i = 0; i < 2; i++) {
            for (let port = 0; port < this.wires[i].length; port++) {
                if (this.wires[i][port]) {
                    this.wires[i][port].delete();
                }
            }
        }
        for (let i = 0; i < components.length; i++) {
            if (this.id == components[i].id) {
                components.splice(i, 1);
                break;
            }
        }
    }
    getPortPos(type, port) {
        const n = this.ports[type];
        const d = type ? 1 : -1;
        return [
            this.x + (this.width / 2 + 30) * d, 
            this.y - this.height / 2 + (port + 0.5) * this.height / n
        ];
    }
    getPower(port) {
        if (this.wires[0][port] && this.wires[0][port].power) {
            return this.wires[0][port].power;
        } else {
            return 0;
        }
    }
    setPower(port, power) {
        if (this.wires[1][port]) {
            this.wires[1][port].power = power;
            this.wires[1][port].updateOutput();
        }
    }
    checkClick(x, y, type) {
        const rect = [
            this.x - this.width / 2, 
            this.y - this.height / 2, 
            this.x + this.width / 2,
            this.y + this.height / 2
        ];
        if (rect[0] < x && rect[1] < y && rect[2] > x && rect[3] > y) {
            if (type == 1 && this.onClick) {
                this.onClick(x, y);
            } else if (type == 0) {
                movingComponent = true;
            }
            selectedComponent = this;
            for (let i = 0; i < components.length; i++) {
                if (this.id == components[i].id) {
                    components.push(components.splice(i, 1)[0]);
                    return true;
                }
            }
        }
        for (let i = 0; i < 2; i++) {
            for (let port = 0; port < this.ports[i]; port++) {
                const portPos = this.getPortPos(i, port);
                if (Math.hypot(portPos[1] - y, portPos[0] - x) <= portSize) {
                    if (floatingWire) {
                        if (!this.wires[i][port] && ((i && !floatingWire.input && this.id != floatingWire.output.id) || (!i && !floatingWire.output && this.id != floatingWire.input.id))) {
                            floatingWire.connect(i, port, this);
                        } else if (this.wires[i][port] && this.wires[i][port].id == floatingWire.id) {
                            floatingWire.disconnect(i, port, this)
                        }
                    } else if (this.wires[i][port]) {
                        if (!floatingWire || (floatingWire && floatingWire.id == this.wires[i][port].id)) {
                            this.wires[i][port].disconnect(i, port, this);
                        }
                    } else if (i) {
                        floatingWire = new Wire(this, undefined, port, 0);
                        wires.push(floatingWire);
                    } else {
                        floatingWire = new Wire(undefined, this, 0, port);
                        wires.push(floatingWire);
                    }
                    return true;
                }
            }
        }
        return false;
    }
}
class LogicGate extends Component {
    constructor(x, y, inPortsN, name) {
        super(x, y, inPortsN, 1, 75, 50);
        this.name = name;
        this.power = 0;
    }
    update() {
        const inputs = [];
        for (let i = 0; i < this.ports[0]; i++) {
            inputs[i] = this.getPower(i);
        }
        this.power = this.logic(inputs);
        this.setPower(0, this.power);
    }
    drawComponent(ctx) {
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.x, this.y + ctx.measureText(this.name).actualBoundingBoxAscent / 2);
    }
}
class BufferGate extends LogicGate {
    constructor(x, y) {
        super(x, y, 1, "Buffer");
    }
    logic(inputs) {
        return inputs[0] ? 1 : 0;
    }
}
class NOTGate extends LogicGate {
    constructor(x, y) {
        super(x, y, 1, "NOT");
    }
    logic(inputs) {
        return inputs[0] ? 0 : 1;
    }
}
class ANDGate extends LogicGate {
    constructor(x, y) {
        super(x, y, 2, "AND");
    }
    logic(inputs) {
        return (inputs[0] && inputs[1]) ? 1 : 0;
    }
}
class ORGate extends LogicGate {
    constructor(x, y) {
        super(x, y, 2, "OR");
    }
    logic(inputs) {
        return (inputs[0] || inputs[1]) ? 1 : 0;
    }
}
class XORGate extends LogicGate {
    constructor(x, y) {
        super(x, y, 2, "XOR");
    }
    logic(inputs) {
        return ((inputs[0] || inputs[1]) && !(inputs[0] && inputs[1])) ? 1 : 0;
    }
}
class NANDGate extends LogicGate {
    constructor(x, y) {
        super(x, y, 2, "NAND");
    }
    logic(inputs) {
        return (inputs[0] && inputs[1]) ? 0 : 1;
    }
}
class NORGate extends LogicGate {
    constructor(x, y) {
        super(x, y, 2, "NOR");
    }
    logic(inputs) {
        return (inputs[0] || inputs[1]) ? 0 : 1;
    }
}
class XNORGate extends LogicGate {
    constructor(x, y) {
        super(x, y, 2, "XNOR");
    }
    logic(inputs) {
        return ((inputs[0] || inputs[1]) && !(inputs[0] && inputs[1])) ? 0 : 1;
    }
}
class Comparator extends LogicGate {
    constructor(x, y) {
        super(x, y, 2, "COMP");
    }
    logic(inputs) {
        return (inputs[0] > inputs[1]) ? 1 : 0;
    }
}
class Switch extends Component {
    constructor(x, y) {
        super(x, y, 2, 1, 75, 50);
        this.power = 0;
        this.enabled = false;
    }
    update() {
        this.enabled = this.getPower(1);
        this.power = this.getPower(0);
        this.setPower(0, this.power * this.enabled);
    }
    drawComponent(ctx) {
        const inPortPos = this.getPortPos(0, 0);
        const outPortPos = this.getPortPos(1, 0);
        const alpha = Math.atan2(outPortPos[1] - inPortPos[1], this.width);
        const d = Math.hypot(outPortPos[1] - inPortPos[1], this.width);
        ctx.strokeStyle = powerColor(this.power);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(inPortPos[0] + 30, inPortPos[1]);
        ctx.lineTo(
            inPortPos[0] + 30 + d * Math.cos(alpha * this.enabled) / 2, 
            inPortPos[1] + d * Math.sin(alpha * this.enabled) / 2
        );
        ctx.stroke();
        ctx.strokeStyle = powerColor(this.power * this.enabled);
        ctx.beginPath();
        ctx.moveTo(outPortPos[0] - 30, outPortPos[1]);
        ctx.lineTo(
            outPortPos[0] - 30 + d * Math.cos(alpha * this.enabled - Math.PI) / 2, 
            outPortPos[1] + d * Math.sin(alpha * this.enabled - Math.PI) / 2
        );
        ctx.stroke();
    }
}
class PowerSwitch extends Component {
    constructor(x, y) {
        super(x, y, 0, 1, 50, 50);
        this.power = 0;
    }
    update() {
        this.setPower(0, this.power);
    }
    onClick() {
        this.power = (this.power ? 0 : 1);
        this.update();
    }
    onKeyPress(key) {
        if (key == " ") {
            this.power = (this.power ? 0 : 1);
        } else if (key == "ArrowLeft") {
            this.power = 0;
        } else if (key == "ArrowRight") {
            this.power = 1;
        }
        this.update();
    }
    drawComponent() {
        ctx.fillStyle = "#666666";
        ctx.fillRect(this.x - 20, this.y - 5, 40, 10);
        ctx.fillStyle = "black";
        ctx.fillRect(this.x + 15 * (this.power ? 1 : -1) - 5, this.y - 15, 10, 30);
    }
}
class PowerMeter extends Component {
    constructor(x, y) {
        super(x, y, 1, 1, 85, 50);
        this.power = 0;
    }
    update() {
        this.power = this.getPower(0);
        this.setPower(0, this.power);
    }
    drawComponent(ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(this.x - this.width / 2 + 5, this.y - this.height / 2 + 5, this.width - 10, this.height - 10);
        let text = Math.round(this.power * 100).toString();
        while (text.length < 3) text = "0" + text;
        ctx.fillStyle = "red";
        ctx.font = "40px Courier";
        ctx.textAlign = "center";
        ctx.fillText(text, this.x, this.y + ctx.measureText(text).actualBoundingBoxAscent / 2);
    }
}
class VariablePower extends Component {
    constructor(x, y) {
        super(x, y, 0, 1, 50, 50);
        this.power = 0;
    }
    update() {
        this.setPower(0, this.power);
    }
    onClick(x, y) {
        const alpha = Math.atan2(y - this.y, x - this.x);
        this.power = Math.round(100 * ((alpha / (2 * Math.PI) + 1.25) % 1)) / 100;
        this.update();
    }
    onKeyPress(key) {
        if (key == "ArrowLeft") {
            this.power -= 0.1;
        } else if (key == "ArrowRight") {
            this.power += 0.1;
        } else if (key == "=" || key == "+") {
            this.power += 0.01;
        } else if (key == "-") {
            this.power -= 0.01;
        } else if (!isNaN(key)) {
            this.power = key * 10 / 90;
        }
        this.power = Math.round(this.power * 100) / 100;
        if (this.power < 0) this.power = 0;
        if (this.power > 1) this.power = 1;
        this.update();
    }
    drawComponent() {
        const alpha = (this.power - 0.25) * 2 * Math.PI;
        ctx.fillStyle = "#666666";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 22 * Math.cos(alpha), this.y + 22 * Math.sin(alpha));
        ctx.stroke();
    }
}
class Clock extends Component {
    constructor(x, y) {
        super(x, y, 2, 1, 75, 75);
        this.powered = 0;
        this.frequency = 0;
        this.power = 0;
        this.startTime = 0;
    }
    update() {
        const newPowered = Boolean(this.getPower(0));
        if (newPowered && !this.powered) {
            this.startTime = Date.now();
        }
        this.powered = newPowered;
        this.frequency = 4.5 * this.getPower(1) + 0.5;
    }
    frameUpdate() {
        const lastPower = this.power;
        if (this.powered) {
            const t = (Date.now() - this.startTime) / 1000;
            this.power = Math.sign(Math.sin(2 * Math.PI * t * this.frequency)) == -1 ? 0 : 1;
        } else {
            this.power = 0;
        }
        if (lastPower != this.power && this.wires[1][0]) {
            this.setPower(0, this.power);
        }
    }
    drawComponent(ctx) {
        const t = (Date.now() - this.startTime) / 1000;
        ctx.fillStyle = ["black", "red"][this.power || !this.powered ? 0 : 1];
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30, 0, 2 * Math.PI);
        ctx.fill();
        if (!this.powered) return;
        ctx.beginPath();
        ctx.fillStyle = ["black", "red"][this.power];
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, 30, 0, (t * this.frequency * 4 * Math.PI) % (2 * Math.PI));
        ctx.fill();
    }
}
class Counter extends Component {
    constructor(x, y) {
        super(x, y, 3, 5, 75, 100);
        this.pulse = false;
        this.enabled = false;
        this.count = 0;
        this.reset = false;
    }
    update() {
        this.enabled = Boolean(this.getPower(1));
        const newReset = Boolean(this.getPower(2));
        if (newReset && !this.reset) {
            this.count = 0;
        }
        this.reset = newReset;
        const newPulse = Boolean(this.getPower(0));
        if (newPulse && !this.pulse && this.enabled) {
            this.count++;
        }
        this.pulse = newPulse;
        for (let i = 0; i < 5; i++) {
            const mod = 2**(4 - i);
            this.setPower(i, !(this.count % mod) && this.pulse ? 1 : 0);
        }
    }
    drawComponent(ctx) {
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "right";
        for (let i = 0; i < this.ports[1]; i++) {
            const portPos = this.getPortPos(1, i);
            const label = (2**(4 - i)).toString();
            ctx.fillText(label, portPos[0] - 32, portPos[1] + ctx.measureText(label).actualBoundingBoxAscent / 2);
        }
    }
}
class Splitter extends Component {
    constructor(x, y) {
        super(x, y, 1, 2, 25, 50);
        this.power = 0;
    }
    update() {
        if (this.wires[0][0] && this.wires[0][0].power) {
            this.power = this.wires[0][0].power;
        } else {
            this.power = 0;
        }
        for (let i = 0; i < this.ports[1]; i++) {
            if (!this.wires[1][i]) continue;
            this.wires[1][i].power = this.power;
            this.wires[1][i].updateOutput();
        }
    }
}
class MemoryCell extends Component {
    constructor(x, y) {
        super(x, y, 2, 1, 50, 50);
        this.power = 0;
        this.locked = false;
    }
    update() {
        if (this.wires[0][1] && this.wires[0][1].power) {
            this.locked = true;
        } else {
            if (this.wires[0][0] && this.wires[0][0].power) {
                this.power = this.wires[0][0].power;
            } else {
                this.power = 0;
            }
            this.locked = false;
        }
        if (this.wires[1][0]) {
            this.wires[1][0].power = this.power;
            this.wires[1][0].updateOutput();
        }
    }
    drawComponent(ctx) {
        ctx.fillStyle = powerColor(this.power);
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        ctx.lineWidth = 5;
        ctx.strokeStyle = powerColor(this.locked ? 1 : 0);
        ctx.strokeRect(this.x - 20, this.y - 20, 40, 40);
    }
}
class TFlipFlop extends Component {
    constructor(x, y) {
        super(x, y, 1, 1, 75, 50);
        this.power = 0;
        this.input = 0;
    }
    update() {
        const newInput = this.getPower(0);
        if (newInput && !this.input) {
            this.power = (this.power ? 0 : 1);
        }
        this.input = newInput;
        this.setPower(0, this.power);
    }
    drawComponent(ctx) {
        const outPortPos = this.getPortPos(1, 0);
        ctx.strokeStyle = powerColor(this.power);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(outPortPos[0] - 30, this.y);
        ctx.stroke();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, (this.power + 0.5) * Math.PI, (this.power + 1.5) * Math.PI);;
        ctx.fill();
    }
}
class MonostableMultivibrator extends Component {
    constructor(x, y) {
        super(x, y, 1, 1, 75, 50);
        this.power = 0;
        this.powerIn = 0;
        this.pulseLength = 0.1;
    }
    update() {
        const newPower = this.getPower(0);
        if (newPower && !this.powerIn) {
            this.power = 1;
            console.log(this.power);
            this.setPower(0, this.power);
            setTimeout(() => {
                this.power = 0;
                this.setPower(0, this.power);
            }, this.pulseLength * 1000);
        }
        this.powerIn = newPower;
    }
}
class Delayer extends Component {
    constructor(x, y) {
        super(x, y, 2, 1, 75, 50);
        this.power = 0;
        this.powerIn = 0;
        this.delay = 0;
    }
    update() {
        this.delay = 4 * this.getPower(1);
        const newPower = this.getPower(0);
        if (this.powerIn != newPower) {
            setTimeout(() => {
                this.power = newPower;
                this.setPower(0, this.power);
            }, this.delay * 1000);
        }
        this.powerIn = newPower;
    }
    drawComponent() {
        ctx.fillStyle = "black";
        ctx.fillRect(this.x - 30, this.y + 5, 60, 15);
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - 30, this.y + 5, 60 * this.delay / 4, 15);
    }
}
class LED extends Component {
    constructor(x, y) {
        super(x, y, 1, 0, 50, 50);
        this.power = 0;
    }
    update(power) {
        this.power = power;
    }
    drawComponent(ctx) {
        ctx.fillStyle = `hsl(56, 100%, ${Math.round(60 * this.power)}%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
        ctx.fill();
    }
}
class SevenSegmentDisplay extends Component {
    constructor(x, y) {
        super(x, y, 7, 0, 100, 150);
        this.power = [];
    }
    update(power, port) {
        this.power[port] = power;
    }
    drawComponent(ctx) {
        function translator(component, point) {
            return [
                component.x - component.width / 2 + 20 + point[0] * (component.width - 40),
                component.y - component.height / 2 + 20 + point[1] * (component.height - 40)
            ];
        }
        const points = [[0, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [1, 1]];
        const lines = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5]];
        ctx.fillStyle = "black";
        ctx.fillRect(this.x - this.width / 2 + 10, this.y - this.height / 2 + 10, this.width - 20, this.height - 20);
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.strokeStyle = "darkGray";
        ctx.beginPath();
        for (let i = 0; i < lines.length; i++) {
            ctx.moveTo(...translator(this, points[lines[i][0]]));
            ctx.lineTo(...translator(this, points[lines[i][1]]));
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = "red";
        for (let i = 0; i < lines.length; i++) {
            if (!this.power[i]) continue;
            ctx.moveTo(...translator(this, points[lines[i][0]]));
            ctx.lineTo(...translator(this, points[lines[i][1]]));
        }
        ctx.stroke();
        ctx.lineCap = "butt";
    }
}
class Wire {
    constructor(input, output, outPort, inPort) {
        // input and outPort are PowerSwitch etc
        // output and inPort are LED etc
        this.input = input;
        this.output = output;
        this.inPort = inPort;
        this.outPort = outPort;
        this.power = 0;
        this.hookPoints = [];
        if (input) this.input.wires[1][this.outPort] = this;
        if (output) this.output.wires[0][this.inPort] = this;
        this.id = idCounter++;
        this.update();
        // wire gets power from input's outPort and outputs to output's inPort
    }
    update() {
        if (this.input) {
            this.input.update();
        } else {
            this.power = 0;
        }
        this.updateOutput();
    }
    updateOutput() {
        if (this.output) this.output.update(this.power, this.inPort);
    }
    disconnect(portType, port, component) { // 1 = out, 0 = in
        component.wires[portType][port] = undefined;
        if (portType) { // input disconnected
            this.input = undefined;
        } else {
            this.output.update(0, this.inPort);
            this.output = undefined;
        }
        if (this.input || this.output) {
            floatingWire = this;
            this.update();
        } else {
            floatingWire = undefined;
            this.delete();
        }
    }
    delete() {
        if (this.input) {
            this.input.wires[1][this.outPort] = undefined;
        }
        if (this.output) {
            this.output.update(0, this.inPort);
            this.output.wires[0][this.inPort] = undefined;
        }
        for (let i = 0; i < wires.length; i++) {
            if (this.id == wires[i].id) {
                wires.splice(i, 1);
                break;
            }
        }
    }
    connect(portType, port, component) {
        if (portType) {
            this.input = component;
            this.outPort = port;
        } else {
            this.output = component;
            this.inPort = port;
        }
        component.wires[portType][port] = this;
        floatingWire = undefined;
        this.update();
    }
    draw(ctx) {
        ctx.strokeStyle = powerColor(this.power);
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 2; i++) {
            const component = [this.input, this.output][i];
            if (component) {
                const port = [this.outPort, this.inPort][i];
                ctx.lineTo(...component.getPortPos(i ? 0 : 1, port));    
            } else {
                ctx.lineTo(...mousePos);
            }
            if (!i) {
                this.hookPoints.forEach(point => {
                    ctx.lineTo(...point);
                });
            }
        }
        ctx.stroke();
    }
}
function powerColor(power) {
    return `rgb(${Math.round(255 * power)}, 0, 0)`;
}
function newComponent() {
    const select = document.getElementById("component-select").value;
    components.push(new componentNames[select](400, 300));
}
function clickHandler(event, type) {
    for (let i = components.length - 1; i >= 0; i--) {
        if (components[i].checkClick(...mousePos, type)) return;
    }
    selectedComponent = undefined;
    movingComponent = false;
    if (floatingWire) {
        if (floatingWire.input) {
            floatingWire.hookPoints.push([...mousePos]);
        } else {
            floatingWire.hookPoints.unshift([...mousePos]);
        }
    }
}
function draw(ctx) {
    ctx.clearRect(0, 0, 800, 600);
    components.forEach(component => {
        component.draw(ctx);
    });
    wires.forEach(wire => {
        wire.draw(ctx);
    });
}
function loop() {
    components.forEach(component => {
        if (component.frameUpdate) component.frameUpdate();
    });
    draw(ctx);
    requestAnimationFrame(loop);
}
const canvas = document.getElementById("canvas");
canvas.addEventListener("mousedown", event => {
    clickHandler(event, event.button ? 1 : 0);
});
canvas.addEventListener("mouseup", event => {
    movingComponent = false;
});
canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
});
canvas.addEventListener("mousemove", event => {
    const rect = canvas.getBoundingClientRect();
    mousePos = [event.clientX - rect.left, event.clientY - rect.top];
    if (movingComponent) {
        selectedComponent.x += event.movementX;
        selectedComponent.y += event.movementY;
    }
});
window.addEventListener("keydown", event => {
    if (selectedComponent) {
        if (event.key == "Backspace" || event.key == "Delete") {
            selectedComponent.delete();
            if (components.length) {
                selectedComponent = components[components.length - 1];
            }
        } else if (event.key == "c" && selectedComponent) {
            const newComponent = new (eval(selectedComponent.constructor.name))(selectedComponent.x + 5, selectedComponent.y + 5);
            components.push(newComponent);
            selectedComponent = newComponent;
        } else if (selectedComponent.onKeyPress) {
            selectedComponent.onKeyPress(event.key);
        }
    }
})
const portSize = 7.5;
const ctx = canvas.getContext("2d");
let mousePos, floatingWire, selectedComponent, movingComponent;
let idCounter = 0;
const componentNames = {
    "power-switch": PowerSwitch,
    "variable-power": VariablePower,
    "clock": Clock,
    "counter": Counter,
    "memory-cell": MemoryCell,
    "t-flip-flop": TFlipFlop,
    "monostable-multivibrator": MonostableMultivibrator,
    "delayer": Delayer,
    "switch": Switch,
    "led": LED,
    "seven-segment-display": SevenSegmentDisplay,
    "splitter": Splitter,
    "comparator": Comparator,
    "power-meter": PowerMeter,
    "buffer-gate": BufferGate,
    "not-gate": NOTGate,
    "and-gate": ANDGate,
    "or-gate": ORGate,
    "xor-gate": XORGate,
    "nand-gate": NANDGate,
    "nor-gate": NORGate,
    "xnor-gate": XNORGate
}
const components = [
    new PowerSwitch(200, 200),
    new VariablePower(200, 400),
    new LED(600, 250),
    new TFlipFlop(400, 300)
];
const wires = [];
loop();
