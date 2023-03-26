import Matter from "matter-js";
import { Camera } from "./camera";
import { Rectangle } from "./Rectangle";

export class Renderer {
    camera: Camera;
    canvas: HTMLCanvasElement;
    rectangles: Rectangle[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.camera = new Camera(canvas);

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    render(engine: Matter.Engine) {
        const bodies = Matter.Composite.allBodies(engine.world);

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        // Clear the screen:
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(1, 1);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const scale = this.camera.zoom;
        ctx.setTransform(scale, 0, 0, scale, this.camera.width / 2, this.camera.height / 2);
        ctx.translate(-this.camera.position.x, -this.camera.position.y);

        for (const body of bodies) {
            const offset = this.camera.position;

            const vertices = body.vertices;

            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);

            for (let j = 1; j < vertices.length; j += 1) {
                ctx.lineTo(vertices[j].x, vertices[j].y);
            }

            ctx.lineTo(vertices[0].x, vertices[0].y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#FF0000';
            ctx.fill();
            ctx.stroke();
        }

        for (const rect of this.rectangles) {
            const offset = this.camera.position;

            ctx.beginPath();
            ctx.rect(rect.position.x, rect.position.y, rect.width, rect.height);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = rect.fillColor;
            ctx.fill();
            ctx.stroke();
        }
    }

    renderRectangle(box: Rectangle) {
        if (!this.rectangles.includes(box)) {
            this.rectangles.push(box);
        } else {
            const index = this.rectangles.indexOf(box);
            this.rectangles[index] = box;
        }
    }

    clearRectangle(box: Rectangle) {
        if (this.rectangles.includes(box)) {
            this.rectangles.splice(this.rectangles.indexOf(box), 1);
        }
    }
}