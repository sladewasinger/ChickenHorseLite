import { LiteEvent } from "./LiteEvent/LiteEvent";
import { Renderer } from "./renderer";
import { Vector2D } from "./Vector2D";

export class Mouse {
    renderer: Renderer;
    canvas: HTMLCanvasElement;
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    isButton1Down: boolean;
    isButton2Down: boolean;
    isButton3Down: boolean;
    private readonly _onMouse1Down = new LiteEvent<void>();
    private readonly _onMouse1Up = new LiteEvent<void>();
    private readonly _onMouse2Down = new LiteEvent<void>();
    private readonly _onMouse2Up = new LiteEvent<void>();
    private readonly _onMouse3Down = new LiteEvent<void>();
    private readonly _onMouse3Up = new LiteEvent<void>();
    private readonly _onMouseMove = new LiteEvent<Vector2D>();
    private readonly _onMouseWheel = new LiteEvent<number>();

    constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.canvas = renderer.canvas;
        this.x = 0;
        this.y = 0;
        this.deltaX = 0;
        this.deltaY = 0;

        this.isButton1Down = false;
        this.isButton2Down = false;
        this.isButton3Down = false;

        console.log("mouse constructor", this.canvas)
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMoveEvent(e));
        this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
        this.canvas.addEventListener("wheel", (event) => this.onMouseWheelEvent(event));
    }

    public get worldPosition() {
        const pos = new Vector2D(this.x, this.y);
        pos.x -= this.renderer.camera.position.x * this.renderer.camera.zoom;
        pos.y -= this.renderer.camera.position.y * this.renderer.camera.zoom;
        return pos;
    }

    public get onMouse1Down() {
        return this._onMouse1Down.expose();
    }

    public get onMouse1Up() {
        return this._onMouse1Up.expose();
    }

    public get onMouse2Down() {
        return this._onMouse2Down.expose();
    }

    public get onMouse2Up() {
        return this._onMouse2Up.expose();
    }

    public get onMouse3Down() {
        return this._onMouse3Down.expose();
    }

    public get onMouse3Up() {
        return this._onMouse3Up.expose();
    }

    public get onMouseMove() {
        return this._onMouseMove.expose();
    }

    public get onMouseWheel() {
        return this._onMouseWheel.expose();
    }

    private onMouseDown(e: MouseEvent) {
        if (e.button === 0) {
            this.isButton1Down = true;
            this._onMouse1Down.trigger();
        } else if (e.button === 1) {
            this.isButton2Down = true;
            this._onMouse2Down.trigger();
        } else if (e.button === 2) {
            this.isButton3Down = true;
            this._onMouse3Down.trigger();
        }
    }

    private onMouseUp(e: MouseEvent) {
        if (e.button === 0) {
            this.isButton1Down = false;
            this._onMouse1Up.trigger();
        } else if (e.button === 1) {
            this.isButton2Down = false;
            this._onMouse2Up.trigger();
        } else if (e.button === 2) {
            this.isButton3Down = false;
            this._onMouse3Up.trigger();
        }
    }

    private onMouseMoveEvent(e: MouseEvent) {
        const originalPos = new Vector2D(this.x, this.y);

        // get mouse position on canvas
        const rect = this.canvas.getBoundingClientRect();
        this.x = e.clientX - rect.left;
        this.y = e.clientY - rect.top;

        const delta = new Vector2D(this.x - originalPos.x, this.y - originalPos.y);
        this.deltaX = delta.x;
        this.deltaY = delta.y;

        this._onMouseMove.trigger(new Vector2D(this.x, this.y));
    }

    private onMouseWheelEvent(event: WheelEvent) {
        event.preventDefault();
        this._onMouseWheel.trigger(event.deltaY);
    }
}