import Matter from "matter-js";
import { Engine } from "../engine";
import { Mouse } from "../mouse";
import { Plugin } from "../pluginHandler";
import { Renderer } from "../renderer";
import { Rectangle } from "../Rectangle";
import { Vector2D } from "../Vector2D";

export class BoxCreator implements Plugin {
    box: Rectangle | null = null;
    creating: boolean = false;
    mouse: Mouse;
    engine: Engine;
    renderer: Renderer;

    constructor(engine: Engine, renderer: Renderer) {
        this.mouse = renderer.mouse;
        this.engine = engine;
        this.renderer = renderer;

        this.mouse.onMouse1Down.on(() => this.onMouseDown());
        this.mouse.onMouse1Up.on(() => this.onMouseUp());
        this.mouse.onMouseMove.on(() => this.onMouseMove());
    }

    onMouseDown() {
        if (this.mouse.isButton1Down) {
            const pos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
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

    onMouseMove(pos?: Vector2D) {
        if (this.box) {
            const worldPos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
            const pos = new Vector2D(worldPos.x - this.box.position.x, worldPos.y - this.box.position.y);

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