import { Engine } from "../engine/engine";
import { Mouse } from "../renderer/mouse";
import { Renderer } from "../renderer/renderer";
import { Vector2D } from "shared/math/Vector2D";
import { Plugin } from "../engine/pluginHandler";
import { Rectangle } from "../models/Rectangle";

export class MousePan implements Plugin {
    mouse: Mouse;
    engine: Engine;
    renderer: Renderer;
    mouseRect: Rectangle = new Rectangle(new Vector2D(0, 0), 10, 10, "green");

    constructor(engine: Engine, renderer: Renderer) {
        this.mouse = renderer.mouse;
        this.engine = engine;
        this.renderer = renderer;

        this.mouse.onMouse2Down.on(() => this.onMouseDown());
        this.mouse.onMouse2Up.on(() => this.onMouseUp());
        this.mouse.onMouseMove.on(() => this.onMouseMove());
        this.mouse.onMouseWheel.on((e) => this.zoom(e));
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

    onMouseMove() {
        if (this.renderer.camera.isPanning) {
            this.renderer.translate(this.mouse.deltaX, this.mouse.deltaY)
        }
    }

    zoom(deltaY?: number): void {
        if (!deltaY)
            return;

        const worldPos = this.renderer.screenToWorld(new Vector2D(this.mouse.x, this.mouse.y));
        this.renderer.zoomAroundPoint(deltaY, worldPos);
    }
}