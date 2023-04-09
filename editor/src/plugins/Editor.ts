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
    ghostMouseRect: Rectangle | null = null;

    gridSize: number = 10;

    constructor(engine: Engine, renderer: Renderer) {
        this.engine = engine;
        this.renderer = renderer;
        this.mouse = renderer.mouse;

        this.mouse.onMouse1Down.on(() => this.onMouseDown());
        this.mouse.onMouse1Up.on(() => this.onMouse1Up());
        this.mouse.onMouse3Up.on(() => this.onMouse3Up());
        this.mouse.onMouseMove.on(() => this.onMouseMove());
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
        this.renderer.render(this.engine.matterEngine);
        this.renderer.renderGrid(this.gridSize);
        this.renderer.renderText(`Mouse: ${gridPos.x}, ${gridPos.y}`, new Vector2D(-25, -25));
        this.renderer.renderRectangle(this.ghostMouseRect);
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

    onMouse1Up() {
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

    onMouse3Up(): void {
        if (this.mouse.isButton3Down)
            return;

        let pos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
        pos = this.snapToGrid(pos);

        let bodies = Matter.Query.point(this.engine.matterEngine.world.bodies, pos);
        if (bodies.length > 0) {
            Matter.World.remove(this.engine.matterEngine.world, bodies[0]);
        }
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
