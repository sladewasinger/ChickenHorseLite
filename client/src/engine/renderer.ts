import Matter from "matter-js";
import { Camera } from "./camera";
import { Rectangle } from "./Rectangle";

export class Renderer {
    camera: Camera;
    canvas: HTMLCanvasElement;

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

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(1, 1);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        //set canvas scale to mouse scale
        console.log(this.camera.zoom);
        ctx.scale(this.camera.zoom, this.camera.zoom);

        for (const body of bodies) {
            const offset = this.camera.position;

            const vertices = body.vertices;

            ctx.beginPath();
            ctx.moveTo(vertices[0].x + offset.x, vertices[0].y + offset.y);

            for (let j = 1; j < vertices.length; j += 1) {
                ctx.lineTo(vertices[j].x + offset.x, vertices[j].y + offset.y);
            }

            ctx.lineTo(vertices[0].x + offset.x, vertices[0].y + offset.y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#FF0000';
            ctx.fill();
            ctx.stroke();
        }
    }

    renderRectangle(box: Rectangle) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not found');
        }

        const offset = this.camera.position;

        ctx.beginPath();
        ctx.rect(box.position.x + offset.x, box.position.y + offset.y, box.width, box.height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#FF0000';
        ctx.fill();
        ctx.stroke();
    }
}