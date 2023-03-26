import { Vector2D } from "./Vector2D";

export class Camera {
    position: Vector2D;
    zoom: number;
    isPanning: boolean;
    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.position = new Vector2D(0, 0);
        this.zoom = 1;
        this.isPanning = false;
    }

    public get worldPosition() {
        return new Vector2D(this.position.x * this.zoom, this.position.y * this.zoom);
    }

    public get worldWidth() {
        return this.zoom * this.width;
    }

    public get worldHeight() {
        return this.zoom * this.height;
    }

    public get width() {
        return this.canvas.width;
    }

    public get height() {
        return this.canvas.height;
    }
}