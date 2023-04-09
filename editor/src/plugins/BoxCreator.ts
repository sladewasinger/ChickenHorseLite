import Matter from "matter-js";
import { Engine } from "../engine/engine";
import { Mouse } from "../renderer/mouse";
import { Plugin } from "../engine/pluginHandler";
import { Renderer } from "../renderer/renderer";
import { Rectangle } from "../models/Rectangle";
import { Vector2D } from "../math/Vector2D";
import { isNull } from "mathjs";

export class Editor implements Plugin {
    engine: Engine;
    renderer: Renderer;
    box: Rectangle | null = null;
    creating: boolean = false;
    mouse: Mouse;
    mouseRect: Rectangle | null = null;

    gridSize: number = 16;

    constructor(engine: Engine, renderer: Renderer) {
        this.engine = engine;
        this.renderer = renderer;
        this.mouse = renderer.mouse;

        this.mouse.onMouse1Down.on(() => this.onMouseDown());
        this.mouse.onMouse1Up.on(() => this.onMouseUp());
        this.mouse.onMouseMove.on(() => this.onMouseMove());
    }

    snapToGrid(pos: Vector2D) {
        return new Vector2D(
            Math.round(pos.x / this.gridSize) * this.gridSize,
            Math.round(pos.y / this.gridSize) * this.gridSize);
    }

    run() {
        let pos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
        pos = this.snapToGrid(pos);
        if (this.mouseRect == null) {
            this.mouseRect = new Rectangle(pos, 10, 10);
            this.mouseRect.fillColor = 'yellow';
        } else {
            this.mouseRect.position = pos;
        }

        this.renderer.renderRectangle(this.mouseRect);

        if (this.box) {
            this.renderer.renderRectangle(this.box);
        }
    }


    onMouseDown() {
        if (this.mouse.isButton1Down) {
            let pos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));

            pos = this.snapToGrid(pos);

            this.box = new Rectangle(pos, 0, 0);
        }
    }

    onMouseUp() {
        if (this.mouse.isButton1Down)
            return;

        if (this.box) {
            const body = Matter.Bodies.rectangle(
                this.box.position.x + this.box.width / 2,
                this.box.position.y + this.box.height / 2,
                this.box.width, this.box.height,
                { isStatic: true });
            Matter.World.add(this.engine.matterEngine.world, body);
        }
        this.box = null;
    }

    onMouseMove(mousePos?: Vector2D) {
        if (this.box) {
            const worldPos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
            let pos = new Vector2D(worldPos.x - this.box.position.x, worldPos.y - this.box.position.y);
            pos = this.snapToGrid(pos);

            this.box.width = pos.x;
            this.box.height = pos.y;
        }
    }
}

export class BoxCreator implements Plugin {
    box: Rectangle | null = null;
    creating: boolean = false;
    mouse: Mouse;
    engine: Engine;
    renderer: Renderer;
    gridSize: number = 16;

    constructor(engine: Engine, renderer: Renderer) {
        this.mouse = renderer.mouse;
        this.engine = engine;
        this.renderer = renderer;

        this.mouse.onMouse1Down.on(() => this.onMouseDown());
        this.mouse.onMouse1Up.on(() => this.onMouseUp());
        this.mouse.onMouseMove.on(() => this.onMouseMove());
    }

    snapToGrid(pos: Vector2D) {
        return new Vector2D(
            Math.round(pos.x / this.gridSize) * this.gridSize,
            Math.round(pos.y / this.gridSize) * this.gridSize);
    }

    onMouseDown() {
        if (this.mouse.isButton1Down) {
            let pos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));

            pos = this.snapToGrid(pos);

            this.box = new Rectangle(pos, 0, 0);
        }
    }

    onMouseUp() {
        if (this.mouse.isButton1Down)
            return;

        if (this.box) {
            const body = Matter.Bodies.rectangle(
                this.box.position.x + this.box.width / 2,
                this.box.position.y + this.box.height / 2,
                this.box.width, this.box.height,
                { isStatic: true });
            Matter.World.add(this.engine.matterEngine.world, body);
        }
        this.box = null;
    }

    onMouseMove(mousePos?: Vector2D) {
        if (this.box) {
            const worldPos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
            let pos = new Vector2D(worldPos.x - this.box.position.x, worldPos.y - this.box.position.y);
            pos = this.snapToGrid(pos);

            this.box.width = pos.x;
            this.box.height = pos.y;
        }
    }

    run() {
        if (this.box) {
            this.renderer.renderRectangle(this.box);
        }
    }
}