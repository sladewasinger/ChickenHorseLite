import Matter from "matter-js";
import { Engine } from "../engine/engine";
import { Mouse } from "../renderer/mouse";
import { Plugin } from "../engine/pluginHandler";
import { Renderer } from "../renderer/renderer";
import { Rectangle } from "../models/Rectangle";
import { Vector2D } from "../math/Vector2D";
import { isNull } from "mathjs";
import { CustomBody } from "./CustomBody";
import './EditorStyle.css';

export type EditorMode = 'box' | 'startingZone' | 'endingZone';
export class EditorForm {
    mode: EditorMode = 'box';
    proxy: any;

    constructor() { }

    createForm(onSave: () => void) {
        const tray = document.createElement('div');
        tray.classList.add('tray');
        document.body.appendChild(tray);

        const modeText = document.createElement('div');
        modeText.innerText = `Mode: ${this.mode}`;
        modeText.classList.add('mode-text');
        tray.appendChild(modeText);

        const buttonTray = document.createElement('div');
        buttonTray.classList.add('button-tray');
        tray.appendChild(buttonTray);

        const boxButton = this.createButton('Box', buttonTray, () => this.onBox());
        const startingZoneButton = this.createButton('Starting Zone', buttonTray, () => this.onStartingZone());
        startingZoneButton.classList.add('blue');
        const endingZoneButton = this.createButton('Ending Zone', buttonTray, () => this.onEndingZone());
        endingZoneButton.classList.add('red');
        const saveButton = this.createButton('Save', buttonTray, () => onSave());
        saveButton.classList.add('green');

        this.proxy = new Proxy(this, {
            set: (target: any, prop: string | symbol, value: any) => {
                target[prop] = value;
                console.log(prop, value)
                if (prop === 'mode') {
                    modeText.innerText = `Mode: ${value}`;
                }
                return true;
            }
        });
    }

    onBox(): void {
        this.proxy.mode = 'box';
    }

    onStartingZone() {
        this.proxy.mode = 'startingZone';
    }

    onEndingZone() {
        this.proxy.mode = 'endingZone';
    }

    createButton(name: string, parent: HTMLElement, action: () => void) {
        const button = document.createElement('button');
        button.innerText = name;
        button.addEventListener('click', action);

        button.classList.add('button');

        parent.appendChild(button);

        return button;
    }
}

export class Editor implements Plugin {
    engine: Engine;
    renderer: Renderer;
    activeBox: Rectangle | null = null;
    creating: boolean = false;
    mouse: Mouse;
    mouseRect: Rectangle | null = null;
    ghostMouseRect: Rectangle | null = null;
    form: EditorForm;
    boxes: Rectangle[] = [];

    gridSize: number = 10;

    constructor(engine: Engine, renderer: Renderer) {
        this.engine = engine;
        this.renderer = renderer;
        this.mouse = renderer.mouse;
        this.form = new EditorForm();
        this.form.createForm(this.onSave.bind(this));

        this.mouse.onMouse1Down.on(() => this.onMouseDown());
        this.mouse.onMouse1Up.on(() => this.onMouse1Up());
        this.mouse.onMouse3Up.on(() => this.onMouse3Up());
        this.mouse.onMouseMove.on(() => this.onMouseMove());
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    get startingZone() {
        return this.boxes.find(b => b.type === 'startingZone');
    }

    get endingZone() {
        return this.boxes.find(b => b.type === 'endingZone');
    }

    onSave() {
        const data = this.boxes.map(b => {
            return {
                position: b.position,
                width: b.width,
                height: b.height,
                type: b.type
            };
        });

        const json = JSON.stringify(data);
        console.log(json);

        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'level.json');
        a.click();

    }

    onKeyDown(e: KeyboardEvent): any {
        if (e.key === 'g') {
            this.gridSize = this.gridSize === 10 ? 50 : 10;
        }

        if (e.key === 'd') {
            const mousePos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
            const bodies = Matter.Query.point(this.engine.matterEngine.world.bodies, mousePos);
            if (bodies.length > 0) {
                Matter.World.remove(this.engine.matterEngine.world, bodies[0]);
            }
        }

        if (e.key === 't') {
            const mousePos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
            const bodies = Matter.Query.point(this.engine.matterEngine.world.bodies, mousePos);
            if (bodies.length > 0) {
                const body = bodies[0] as CustomBody;
                body.killOnContact = !body.killOnContact;
            }
        }
    }

    snapToGrid(pos: Vector2D) {
        return new Vector2D(
            Math.floor(pos.x / this.gridSize) * this.gridSize,
            Math.floor(pos.y / this.gridSize) * this.gridSize
        );
    }

    static snapToGrid(pos: Vector2D, gridSize: number) {
        return new Vector2D(
            Math.floor(pos.x / gridSize) * gridSize,
            Math.floor(pos.y / gridSize) * gridSize
        );
    }

    run() {
        let pos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
        let gridPos = this.snapToGrid(pos);

        if (this.mouseRect == null || this.ghostMouseRect == null) {
            this.mouseRect = new Rectangle(pos, 10, 10);
            this.mouseRect.fillColor = 'yellow';

            this.ghostMouseRect = new Rectangle(pos, 5, 5);
            this.ghostMouseRect.fillColor = 'rgba(0, 255, 255, 0.5)';
        }

        this.ghostMouseRect.position = pos;
        this.mouseRect.position = gridPos;

        this.renderer.clearScreen();

        for (let box of this.boxes) {
            this.renderer.renderRectangle(box);
        }
        if (this.startingZone)
            this.renderer.renderRectangle(this.startingZone);
        if (this.endingZone)
            this.renderer.renderRectangle(this.endingZone);

        this.renderer.render(this.engine.matterEngine);
        this.renderer.renderGrid(this.gridSize);
        this.renderer.renderText(`${gridPos.x}, ${gridPos.y}`, new Vector2D(pos.x + 25, pos.y + 50));
        this.renderer.renderRectangle(this.ghostMouseRect);
        this.renderer.renderRectangle(this.mouseRect);

        if (this.activeBox) {
            this.renderer.renderRectangle(this.activeBox);
        }
    }

    onMouseDown() {
        if (this.mouse.isButton1Down) {
            let pos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));

            pos = this.snapToGrid(pos);

            this.activeBox = new Rectangle(pos, 0, 0);
        }
    }

    onMouse1Up() {
        if (!this.activeBox) {
            return;
        }

        if (this.activeBox.width < 0) {
            this.activeBox.position.x += this.activeBox.width;
            this.activeBox.width = Math.abs(this.activeBox.width);
        }
        if (this.activeBox.height < 0) {
            this.activeBox.position.y += this.activeBox.height;
            this.activeBox.height = Math.abs(this.activeBox.height);
        }

        if (this.activeBox.width <= 0 || this.activeBox.height <= 0) {
            this.activeBox = null;
            return;
        }

        if (this.form.mode === 'box') {
            this.activeBox.fillColor = 'gray';
        } else if (this.form.mode === 'startingZone') {
            if (this.startingZone) {
                this.boxes.splice(this.boxes.indexOf(this.startingZone), 1);
            }
            this.activeBox.fillColor = 'rgba(0, 0, 255, 0.5)';
            this.activeBox.type = 'startingZone';
        } else if (this.form.mode === 'endingZone') {
            if (this.endingZone) {
                this.boxes.splice(this.boxes.indexOf(this.endingZone), 1);
            }
            this.activeBox.fillColor = 'rgba(255, 0, 0, 0.5)';
            this.activeBox.type = 'endingZone';
        }

        this.boxes.push(this.activeBox);

        // const body = Matter.Bodies.rectangle(
        //     this.activeBox.position.x + this.activeBox.width / 2,
        //     this.activeBox.position.y + this.activeBox.height / 2,
        //     this.activeBox.width, this.activeBox.height,
        //     { isStatic: true });
        // Matter.World.add(this.engine.matterEngine.world, body);
        this.activeBox = null;
    }

    onMouse3Up(): void {
        if (this.mouse.isButton3Down)
            return;

        let pos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));

        // delete boxes under mouse
        let boxes = this.getAllBoxesUnderPos(pos);
        if (boxes.length > 0) {
            this.boxes.splice(this.boxes.indexOf(boxes[0]), 1);
        }

        let bodies = Matter.Query.point(this.engine.matterEngine.world.bodies, pos);
        if (bodies.length > 0) {
            Matter.World.remove(this.engine.matterEngine.world, bodies[0]);
        }
    }

    getAllBoxesUnderPos(pos: Vector2D): Rectangle[] {
        let boxes: Rectangle[] = [];

        for (let box of this.boxes) {
            if (box.position.x < pos.x && box.position.x + box.width > pos.x &&
                box.position.y < pos.y && box.position.y + box.height > pos.y) {
                boxes.push(box);
            }
        }

        return boxes;
    }

    onMouseMove(mousePos?: Vector2D) {
        if (this.activeBox) {
            const worldPos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
            let pos = new Vector2D(worldPos.x - this.activeBox.position.x, worldPos.y - this.activeBox.position.y);
            pos = this.snapToGrid(pos);

            this.activeBox.width = pos.x;
            this.activeBox.height = pos.y;
        }
    }
}
