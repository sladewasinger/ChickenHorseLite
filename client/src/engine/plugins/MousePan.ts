import { Engine } from "../engine";
import { Mouse } from "../mouse";
import { Renderer } from "../renderer";
import { Vector2D } from "../Vector2D";
import { Plugin } from "../pluginHandler";

export class MousePan implements Plugin {
    mouse: Mouse;
    engine: Engine;
    renderer: Renderer;

    constructor(canvas: HTMLCanvasElement, mouse: Mouse, engine: Engine, renderer: Renderer) {
        this.mouse = mouse;
        this.engine = engine;
        this.renderer = renderer;

        this.mouse.onMouse2Down.on(() => this.onMouseDown());
        this.mouse.onMouse2Up.on(() => this.onMouseUp());
        this.mouse.onMouseMove.on(() => this.onMouseMove());
    }

    run(): void {
    }

    onMouseDown() {
        if (this.mouse.isButton2Down) {
            this.renderer.camera.isPanning = true;
        }
    }

    onMouseUp() {
        if (this.mouse.isButton2Down)
            return;

        this.renderer.camera.isPanning = false;
    }

    onMouseMove(pos?: Vector2D) {
        if (this.renderer.camera.isPanning) {
            this.renderer.camera.position.x += this.mouse.deltaX;
            this.renderer.camera.position.y += this.mouse.deltaY;
        }
    }
}