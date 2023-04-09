import Matter from "matter-js";
import { Camera } from "./camera";
import { Engine } from "../engine/engine";
import { Mouse } from "./mouse";
import { Rectangle } from "../models/Rectangle";
import { Vector2D } from "../math/Vector2D";
import { Editor } from "../plugins/Editor";
import { CustomBody } from "../plugins/CustomBody";

export class Renderer {
    camera: Camera;
    canvas: HTMLCanvasElement;
    mouse: Mouse;

    rectangles: Rectangle[] = [];
    scale: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.mouse = new Mouse(canvas);
        this.camera = new Camera(canvas);
        this.scale = 1;

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    screenToWorld(pos: Vector2D) {
        return this.getWindowToCanvas(pos.x, pos.y);
    }

    getWindowToCanvas(x: number, y: number) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        var rect = this.canvas.getBoundingClientRect();
        var screenX = (x - rect.left) * (this.canvas.width / rect.width);
        var screenY = (y - rect.top) * (this.canvas.height / rect.height);
        var transform = ctx.getTransform();
        if (transform.isIdentity) {
            return new Vector2D(
                screenX,
                screenY
            );
        } else {
            const invMat = transform.invertSelf();

            return new Vector2D(
                Math.round(screenX * invMat.a + screenY * invMat.c + invMat.e),
                Math.round(screenX * invMat.b + screenY * invMat.d + invMat.f)
            );
        }
    }

    zoomAroundPoint(deltaY: number, point: Vector2D) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        let zoom = this.camera.zoom + deltaY * -0.001;
        zoom = Math.min(Math.max(0.0625, zoom), 8);
        const scale = zoom / this.camera.zoom;
        this.scale = this.scale * scale;

        ctx.translate(point.x, point.y);
        ctx.scale(scale, scale);
        ctx.translate(-point.x, -point.y);

        this.camera.zoom = this.scale;
    }

    pan(x: number, y: number) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        const zoom = this.camera.zoom;
        x = x / zoom;
        y = y / zoom;

        ctx.translate(x, y);
        this.camera.position.x += x;
        this.camera.position.y += y;
    }

    public render(engine: Matter.Engine) {
        const bodies = Matter.Composite.allBodies(engine.world);

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        for (const body of bodies) {
            let customBody = body as CustomBody;
            const vertices = body.vertices;

            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);

            for (let j = 1; j < vertices.length; j += 1) {
                ctx.lineTo(vertices[j].x, vertices[j].y);
            }

            ctx.lineTo(vertices[0].x, vertices[0].y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            if (customBody.killOnContact) {
                ctx.fillStyle = '#ff0000';
            } else {
                ctx.fillStyle = '#333333';
            }
            ctx.fill();
            ctx.stroke();
        }
    }

    public clearScreen() {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        // Clear the screen:
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(1, 1);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }

    renderRectangle(rect: Rectangle) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        ctx.beginPath();
        ctx.rect(rect.position.x, rect.position.y, rect.width, rect.height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = rect.fillColor;
        ctx.fill();
        ctx.stroke();
    }

    clearRectangle(box: Rectangle) {
        if (this.rectangles.includes(box)) {
            this.rectangles.splice(this.rectangles.indexOf(box), 1);
        }
    }

    renderText(text: string, pos: Vector2D) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Arial';
        ctx.fillText(text, pos.x, pos.y);
    }

    renderGrid(gridSize: number) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        let zoom = this.camera.zoom;
        let offset = this.screenToWorld(this.camera.worldPosition);
        offset = Editor.snapToGrid(offset, gridSize);

        const width = this.canvas.width * 4;
        const height = this.canvas.height * 4;

        const startX = 0;
        const startY = 0;

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(256, 0, 256, 0.5)';
        ctx.lineWidth = 1;

        for (let x = startX; x < width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }

        for (let y = startY; y < height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }

        ctx.stroke();
    }
}